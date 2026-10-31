import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { BookOpen, Check, Globe, Lock, Pencil, Pin, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import { notify, notifyUndo } from '@/components/cuaderno/format';
import MarkdownToolbar, { MarkdownAction } from '@/components/notes/MarkdownToolbar';
import MarkdownView from '@/components/notes/MarkdownView';
import NotesHeader from '@/components/notes/NotesHeader';
import LocalGraph, { LocalGraphNode } from '@/components/notes/LocalGraph';
import NoteLinkPickerModal from '@/components/notes/NoteLinkPickerModal';
import {
    TUTORIAL_NOTE_CONTENT,
    TUTORIAL_NOTE_TITLE,
} from '@/components/notes/tutorialNote';
import {
    formatNoteDate,
    NoteDetail,
    noteTitle,
    noteWordCount,
} from '@/shared/entities/Note';
import { useNotesStore } from '@/shared/stores/useNotesStore';

const MONO = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
});

const isFence = (line: string) => /^\s*```/.test(line);
const isTable = (line: string) => /^\s*\|/.test(line);
const isMultilineBlock = (block: string) => isFence(block) || isTable(block);

/**
 * Divide el Markdown en bloques editables. Los cercados de código y las tablas
 * se mantienen como un solo bloque para que el render no los rompa.
 */
function parseBlocks(content: string): string[] {
    const lines = content.split('\n');
    const blocks: string[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        if (isFence(line)) {
            let block = line;
            index += 1;
            while (index < lines.length) {
                block += `\n${lines[index]}`;
                const closes = isFence(lines[index]);
                index += 1;
                if (closes) break;
            }
            blocks.push(block);
            continue;
        }

        if (isTable(line)) {
            let block = line;
            index += 1;
            while (index < lines.length && isTable(lines[index])) {
                block += `\n${lines[index]}`;
                index += 1;
            }
            blocks.push(block);
            continue;
        }

        blocks.push(line);
        index += 1;
    }

    return blocks.length ? blocks : [''];
}

/** Vista y editor por bloques al estilo Notion. */
export default function NoteScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const fetchNote = useNotesStore((s) => s.fetchNote);
    const createNote = useNotesStore((s) => s.createNote);
    const updateNote = useNotesStore((s) => s.updateNote);
    const deleteNote = useNotesStore((s) => s.deleteNote);
    const restoreNote = useNotesStore((s) => s.restoreNote);

    const [note, setNote] = useState<NoteDetail | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [mode, setMode] = useState<'view' | 'edit'>(id ? 'view' : 'edit');
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<string[]>(['']);
    const [activeBlock, setActiveBlock] = useState(0);
    const [blockSelection, setBlockSelection] = useState({ start: 0, end: 0 });
    const [pinned, setPinned] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [visibilityUpdating, setVisibilityUpdating] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [linkPickerOpen, setLinkPickerOpen] = useState(false);
    const [linkQuery, setLinkQuery] = useState('');

    const inputsRef = useRef<Record<number, TextInput | null>>({});
    const savingRef = useRef(false);
    const pendingRef = useRef(false);
    const versionRef = useRef(0);
    const allowExit = useRef(false);
    const persistRef = useRef<() => Promise<boolean>>(async () => false);
    const firstFocus = useRef(true);
    const linkInsertRef = useRef<{ blockIndex: number; start: number } | null>(
        null
    );

    const content = blocks.join('\n');

    /** El tutorial solo se puede cargar en una nota nueva y vacía. */
    const canFillTutorial = !id && !title.trim() && !content.trim();

    /** Título (minúsculas) → id, para resolver `[[...]]` en el render. */
    const linkMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const link of note?.links ?? []) {
            if (link.target_note_id) {
                map[link.raw_title.trim().toLowerCase()] = link.target_note_id;
            }
        }
        return map;
    }, [note?.links]);

    const graphNodes = useMemo<LocalGraphNode[]>(() => {
        const map = new Map<string, LocalGraphNode>();

        for (const link of note?.links ?? []) {
            if (!link.target_note_id || link.target_note_id === note?.id) {
                continue;
            }
            map.set(link.target_note_id, {
                id: link.target_note_id,
                title: link.alias || link.raw_title,
                kind: 'out',
            });
        }

        for (const backlink of note?.backlinks ?? []) {
            if (map.has(backlink.id) || backlink.id === note?.id) continue;
            map.set(backlink.id, {
                id: backlink.id,
                title: noteTitle(backlink),
                kind: 'in',
            });
        }

        return [...map.values()];
    }, [note?.links, note?.backlinks, note?.id]);

    // Carga de la nota existente.
    useEffect(() => {
        if (!id) return;
        let mounted = true;
        (async () => {
            const { note: fetched, error } = await fetchNote(id);
            if (!mounted) return;
            if (error || !fetched) {
                notify('error', error ?? 'Nota no encontrada.');
                if (router.canGoBack()) router.back();
                return;
            }
            const parsed = parseBlocks(fetched.content);
            setNote(fetched);
            setTitle(fetched.title);
            setBlocks(parsed);
            setActiveBlock(Math.max(parsed.length - 1, 0));
            setPinned(fetched.pinned);
            setIsPublic(fetched.is_public);
            setLoading(false);
            setMode('view');
        })();
        return () => {
            mounted = false;
        };
    }, [id, fetchNote]);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    const markDirty = () => {
        versionRef.current += 1;
        setDirty(true);
        setSavedAt(null);
    };

    const persist = useCallback(async (): Promise<boolean> => {
        if (!title.trim() && !content.trim()) {
            notify('error', 'Escribe un título o algo de contenido.');
            return false;
        }
        if (savingRef.current) {
            pendingRef.current = true;
            return false;
        }

        savingRef.current = true;
        setSaving(true);
        const version = versionRef.current;

        try {
            if (id) {
                const { note: updated, error } = await updateNote(id, {
                    title,
                    content,
                    pinned,
                    is_public: isPublic,
                });
                if (error || !updated) {
                    notify('error', error ?? 'No se pudo guardar la nota.');
                    return false;
                }
                setNote((prev) =>
                    prev
                        ? { ...prev, ...updated }
                        : { ...updated, links: [], backlinks: [] }
                );
                if (versionRef.current === version) setDirty(false);
                setSavedAt(new Date());
                return true;
            }

            const { note: created, error } = await createNote({
                title,
                content,
                pinned,
                is_public: isPublic,
            });
            if (error || !created) {
                notify('error', error ?? 'No se pudo crear la nota.');
                return false;
            }
            setNote({ ...created, links: [], backlinks: [] });
            setDirty(false);
            setSavedAt(new Date());
            router.replace({
                pathname: '/notes/note',
                params: { id: created.id },
            } as any);
            return true;
        } finally {
            savingRef.current = false;
            setSaving(false);
            if (pendingRef.current) {
                pendingRef.current = false;
                setTimeout(() => {
                    void persistRef.current();
                }, 0);
            }
        }
    }, [id, title, content, pinned, isPublic, updateNote, createNote]);

    useEffect(() => {
        persistRef.current = persist;
    }, [persist]);

    // Autosave para notas existentes mientras se edita.
    useEffect(() => {
        if (!id || mode !== 'edit' || !dirty) return;
        const timer = setTimeout(() => {
            void persist();
        }, 900);
        return () => clearTimeout(timer);
    }, [id, mode, dirty, title, content, pinned, isPublic, persist]);

    // Refresca enlaces/backlinks al volver de una nota enlazada o al guardar.
    useFocusEffect(
        useCallback(() => {
            if (firstFocus.current) {
                firstFocus.current = false;
                return;
            }
            if (!id || mode !== 'view') return;

            void (async () => {
                const { note: refreshed } = await fetchNote(id);
                if (!refreshed) return;

                const parsed = parseBlocks(refreshed.content);
                setNote(refreshed);
                setTitle(refreshed.title);
                setBlocks(parsed);
                setPinned(refreshed.pinned);
                setIsPublic(refreshed.is_public);
                setActiveBlock((current) =>
                    Math.min(current, Math.max(parsed.length - 1, 0))
                );
            })();
        }, [id, mode, fetchNote])
    );

    // Guardia al salir con cambios sin guardar.
    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
                if (allowExit.current) return;
                if (mode !== 'edit' || !dirty) return;

                event.preventDefault();
                Alert.alert(
                    'Cambios sin guardar',
                    '¿Quieres salir sin guardar esta nota?',
                    [
                        { text: 'Seguir editando', style: 'cancel' },
                        {
                            text: 'Salir sin guardar',
                            style: 'destructive',
                            onPress: () => {
                                allowExit.current = true;
                                navigation.dispatch(event.data.action);
                            },
                        },
                    ]
                );
            });
            return unsubscribe;
        }, [navigation, mode, dirty])
    );

    const saveNow = async () => {
        const ok = await persist();
        if (ok && id) setMode('view');
    };

    const togglePin = async () => {
        const next = !pinned;
        setPinned(next);
        if (!id) {
            markDirty();
            return;
        }
        const { note: updated, error } = await updateNote(id, { pinned: next });
        if (error) {
            setPinned(!next);
            notify('error', error);
            return;
        }
        if (updated) {
            setNote((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        notify('success', next ? 'Nota fijada.' : 'Nota desfijada.');
    };

    /**
     * La visibilidad se guarda al instante en lectura. En edición se marca
     * `dirty` y viaja con el autosave/check para no pisar el contenido abierto.
     */
    const toggleVisibility = async () => {
        if (visibilityUpdating) return;
        const next = !isPublic;

        if (!id || mode === 'edit') {
            setIsPublic(next);
            markDirty();
            return;
        }

        setVisibilityUpdating(true);
        setIsPublic(next);
        const { note: updated, error } = await updateNote(id, {
            is_public: next,
        });
        setVisibilityUpdating(false);

        if (error) {
            setIsPublic(!next);
            notify('error', error);
            return;
        }

        if (updated) {
            setNote((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        notify('success', next ? 'Nota pública.' : 'Nota privada.');
    };

    const confirmDelete = () => {
        if (!note) return;
        Alert.alert('Eliminar nota', 'Podrás deshacerlo desde el aviso.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    const error = await deleteNote(note.id);
                    if (error) {
                        notify('error', error);
                        return;
                    }
                    allowExit.current = true;
                    notifyUndo('Nota eliminada.', () => {
                        void restoreNote(note.id);
                    });
                    router.back();
                },
            },
        ]);
    };

    const startEditing = (index: number) => {
        const block = blocks[index] ?? '';
        setMode('edit');
        setActiveBlock(index);
        setBlockSelection({ start: block.length, end: block.length });
        setTimeout(() => inputsRef.current[index]?.focus(), 0);
    };

    const openLinkedNote = (targetId: string) => {
        if (!targetId || targetId === note?.id) return;
        router.push({
            pathname: '/notes/note',
            params: { id: targetId },
        } as any);
    };

    const createLinkedNote = (rawTitle: string) => {
        const clean = rawTitle.trim();
        if (!clean) return;

        Alert.alert(
            'Crear nota',
            `¿Quieres crear la nota «${clean}» y enlazarla?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Crear',
                    onPress: async () => {
                        const { note: created, error } = await createNote({
                            title: clean,
                        });
                        if (error || !created) {
                            notify(
                                'error',
                                error ?? 'No se pudo crear la nota.'
                            );
                            return;
                        }
                        openLinkedNote(created.id);
                    },
                },
            ]
        );
    };

    const openLinkPicker = (initialQuery = '') => {
        linkInsertRef.current = {
            blockIndex: activeBlock,
            start: blockSelection.start,
        };
        setLinkQuery(initialQuery);
        setLinkPickerOpen(true);
    };

    const insertWikiLink = (rawTitle: string) => {
        const context = linkInsertRef.current;
        if (!context) {
            setLinkPickerOpen(false);
            return;
        }

        const title = rawTitle.trim();
        if (!title) {
            setLinkPickerOpen(false);
            return;
        }

        const block = blocks[context.blockIndex] ?? '';
        const tail = block.slice(context.start);
        // Si venimos de escribir `[[`, reemplaza el parcial.
        const cleanedTail = tail.startsWith('[[')
            ? tail.replace(/^\[\[[^\]\n]*$/, '')
            : tail;

        const insertion = `[[${title}]]`;
        const next = block.slice(0, context.start) + insertion + cleanedTail;
        setBlocks((prev) =>
            prev.map((value, index) =>
                index === context.blockIndex ? next : value
            )
        );
        markDirty();
        linkInsertRef.current = null;
        setLinkPickerOpen(false);

        const cursor = context.start + insertion.length;
        setActiveBlock(context.blockIndex);
        setBlockSelection({ start: cursor, end: cursor });
        setTimeout(
            () => inputsRef.current[context.blockIndex]?.focus(),
            0
        );
    };

    const createAndInsertLink = async (rawTitle: string) => {
        const clean = rawTitle.trim();
        if (!clean) return;

        const { note: created, error } = await createNote({ title: clean });
        if (error || !created) {
            notify('error', error ?? 'No se pudo crear la nota.');
            return;
        }

        insertWikiLink(created.title);
    };

    /**
     * Rellena la nota **solo si está nueva y vacía**. Nunca sobrescribe una
     * nota existente ni una que ya tenga contenido.
     */
    const applyTutorial = () => {
        if (!canFillTutorial) {
            notify(
                'error',
                'El tutorial solo está disponible en una nota nueva y vacía.'
            );
            return;
        }

        const parsed = parseBlocks(TUTORIAL_NOTE_CONTENT);
        setTitle(TUTORIAL_NOTE_TITLE);
        setBlocks(parsed);
        setActiveBlock(0);
        setBlockSelection({ start: 0, end: 0 });
        markDirty();
        notify('info', 'Tutorial cargado. Edítalo o guárdalo como nota.');
    };

    const updateBlock = (index: number, text: string) => {
        setBlocks((prev) => prev.map((block, i) => (i === index ? text : block)));
        markDirty();
    };

    const handleBlockChange = (index: number, text: string) => {
        const current = blocks[index] ?? '';

        // Código/tabla: los saltos de línea forman parte del mismo bloque.
        if (isMultilineBlock(current)) {
            updateBlock(index, text);
            return;
        }

        // Al cambiar de línea, el bloque anterior se renderiza y nace uno nuevo.
        if (text.includes('\n')) {
            const [first, ...rest] = text.split('\n');
            // Continúa listas y checklists automáticamente, como Notion.
            const listPrefix =
                first.match(/^(\s*(?:[-*+]|\d+\.)\s+(?:\[[ xX]\]\s+)?)/)?.[1] ?? '';
            const newBlock = `${listPrefix}${rest[0] ?? ''}`;
            setBlocks((prev) => {
                const next = [...prev];
                next.splice(index, 1, first, newBlock, ...rest.slice(1));
                return next;
            });
            markDirty();
            setActiveBlock(index + 1);
            setBlockSelection({
                start: listPrefix.length,
                end: listPrefix.length,
            });
            setTimeout(() => inputsRef.current[index + 1]?.focus(), 0);
            return;
        }

        updateBlock(index, text);

        // Al escribir exactamente `[[`, abre el buscador de notas. Si el
        // usuario cierra el picker, no se vuelve a abrir hasta otro `[[`.
        if (text.endsWith('[[')) {
            linkInsertRef.current = {
                blockIndex: index,
                start: text.length - 2,
            };
            setLinkQuery('');
            setLinkPickerOpen(true);
        }
    };

    const mergeWithPrevious = (index: number) => {
        if (index <= 0 || (blocks[index] ?? '') !== '') return;
        const previousLength = (blocks[index - 1] ?? '').length;
        setBlocks((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
        markDirty();
        setActiveBlock(index - 1);
        setBlockSelection({ start: previousLength, end: previousLength });
        setTimeout(() => inputsRef.current[index - 1]?.focus(), 0);
    };

    const replaceActiveBlock = (
        next: string,
        nextSelection?: { start: number; end: number }
    ) => {
        setBlocks((prev) => prev.map((block, i) => (i === activeBlock ? next : block)));
        markDirty();
        if (nextSelection) setBlockSelection(nextSelection);
        requestAnimationFrame(() => inputsRef.current[activeBlock]?.focus());
    };

    const wrapSelection = (before: string, after: string) => {
        const current = blocks[activeBlock] ?? '';
        const { start, end } = blockSelection;
        const selected = current.slice(start, end);
        const next = current.slice(0, start) + before + selected + after + current.slice(end);
        const cursor = start + before.length;
        replaceActiveBlock(next, { start: cursor, end: cursor + selected.length });
    };

    const togglePrefix = (prefix: string, heading = false) => {
        const current = blocks[activeBlock] ?? '';
        const existing = heading ? current.match(/^#{1,6}\s+/) : null;

        if (existing && existing[0] === prefix) {
            const existingLength = existing[0].length;
            replaceActiveBlock(current.slice(existingLength), {
                start: 0,
                end: Math.max(0, blockSelection.end - existingLength),
            });
            return;
        }
        if (!existing && current.startsWith(prefix)) {
            replaceActiveBlock(current.slice(prefix.length), {
                start: Math.max(0, blockSelection.start - prefix.length),
                end: Math.max(0, blockSelection.end - prefix.length),
            });
            return;
        }

        const existingLength = existing ? existing[0].length : 0;
        const base = existing ? current.slice(existingLength) : current;
        replaceActiveBlock(prefix + base, {
            start: blockSelection.start + prefix.length - existingLength,
            end: blockSelection.end + prefix.length - existingLength,
        });
    };

    const applyFormat = (action: MarkdownAction) => {
        const current = blocks[activeBlock] ?? '';

        switch (action) {
            case 'bold':
                return wrapSelection('**', '**');
            case 'italic':
                return wrapSelection('_', '_');
            case 'h1':
                return togglePrefix('# ', true);
            case 'h2':
                return togglePrefix('## ', true);
            case 'bullet':
                return togglePrefix('- ');
            case 'check':
                return togglePrefix('- [ ] ');
            case 'quote':
                return togglePrefix('> ');
            case 'link': {
                const { start, end } = blockSelection;
                const label = current.slice(start, end) || 'texto';
                const insert = `[${label}](https://)`;
                const urlOffset = insert.indexOf('https://');
                const next = current.slice(0, start) + insert + current.slice(end);
                return replaceActiveBlock(next, {
                    start: start + urlOffset,
                    end: start + urlOffset + 8,
                });
            }
            case 'wikilink':
                openLinkPicker('');
                return;
            case 'codeblock': {
                if (current.startsWith('```')) {
                    const next = current
                        .replace(/^```[^\n]*\n?/, '')
                        .replace(/\n?```\s*$/, '');
                    return replaceActiveBlock(next, { start: 0, end: 0 });
                }
                const next = `\`\`\`\n${current}\n\`\`\``;
                return replaceActiveBlock(next, {
                    start: 4,
                    end: 4 + current.length,
                });
            }
            case 'divider': {
                const nextActive = activeBlock + 2;
                setBlocks((prev) => {
                    const next = [...prev];
                    next.splice(activeBlock + 1, 0, '---', '');
                    return next;
                });
                markDirty();
                setActiveBlock(nextActive);
                setBlockSelection({ start: 0, end: 0 });
                setTimeout(() => inputsRef.current[nextActive]?.focus(), 0);
                return;
            }
            default:
                return;
        }
    };

    const headerSubtitle =
        mode === 'edit'
            ? saving
                ? 'Guardando…'
                : dirty
                  ? 'Sin guardar'
                  : savedAt
                    ? 'Guardado'
                    : undefined
            : note
              ? `${formatNoteDate(note.updated_at)} · ${noteWordCount(content)} palabras`
              : undefined;

    const headerRight =
        mode === 'edit' ? (
            <View style={styles.editHeaderActions}>
                <TouchableOpacity
                    style={styles.tutorialAction}
                    onPress={() => void toggleVisibility()}
                    activeOpacity={0.6}
                    accessibilityLabel={
                        isPublic
                            ? 'Nota pública, tocar para hacerla privada'
                            : 'Nota privada, tocar para hacerla pública'
                    }
                >
                    {isPublic ? (
                        <Globe size={18} color="#2f8f5b" />
                    ) : (
                        <Lock size={18} color="#555" />
                    )}
                </TouchableOpacity>
                {canFillTutorial && (
                    <TouchableOpacity
                        style={styles.tutorialAction}
                        onPress={applyTutorial}
                        activeOpacity={0.6}
                        accessibilityLabel="Rellenar con el tutorial"
                    >
                        <BookOpen size={18} color="#555" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={saveNow}
                    disabled={saving}
                    activeOpacity={0.6}
                    accessibilityLabel="Guardar nota"
                >
                    <Check size={20} color="#111" />
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => void toggleVisibility()}
                    disabled={visibilityUpdating}
                    activeOpacity={0.6}
                    accessibilityLabel={
                        isPublic
                            ? 'Nota pública, tocar para hacerla privada'
                            : 'Nota privada, tocar para hacerla pública'
                    }
                >
                    {isPublic ? (
                        <Globe size={18} color="#2f8f5b" />
                    ) : (
                        <Lock size={18} color="#555" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={togglePin}>
                    <Pin
                        size={18}
                        color={pinned ? '#b45309' : '#555'}
                        fill={pinned ? '#b45309' : 'transparent'}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => startEditing(blocks.length - 1)}>
                    <Pencil size={18} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
                    <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
            </View>
        );

    if (loading) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    <NotesHeader title="Nota" subtitle="Cargando…" />
                    <SkeletonShimmer>
                        <View style={styles.skeleton}>
                            <SkeletonBlock w="72%" h={30} />
                            <SkeletonBlock w="45%" h={12} />
                            <SkeletonBlock w="100%" h={14} />
                            <SkeletonBlock w="96%" h={14} />
                            <SkeletonBlock w="88%" h={14} />
                        </View>
                    </SkeletonShimmer>
                </View>
            </LayoutAuthenticated>
        );
    }

    return (
        <LayoutAuthenticated>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <NotesHeader
                    title={mode === 'edit' ? (note ? 'Editar nota' : 'Nueva nota') : noteTitle({ title })}
                    subtitle={headerSubtitle}
                    right={headerRight}
                />

                {mode === 'view' && note ? (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.viewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <TextMalet style={styles.noteTitle}>{noteTitle({ title })}</TextMalet>
                        <TextMalet style={styles.meta}>
                            {formatNoteDate(note.updated_at)} · {noteWordCount(content)}{' '}
                            palabras
                        </TextMalet>
                        <TouchableOpacity
                            style={[
                                styles.visibilityPill,
                                isPublic && styles.visibilityPillPublic,
                            ]}
                            onPress={() => void toggleVisibility()}
                            disabled={visibilityUpdating}
                            activeOpacity={0.75}
                            accessibilityLabel={
                                isPublic
                                    ? 'Nota pública, tocar para hacerla privada'
                                    : 'Nota privada, tocar para hacerla pública'
                            }
                        >
                            {isPublic ? (
                                <Globe size={13} color="#2f8f5b" />
                            ) : (
                                <Lock size={13} color="#6b6b6b" />
                            )}
                            <TextMalet
                                style={[
                                    styles.visibilityPillText,
                                    isPublic && styles.visibilityPillTextPublic,
                                ]}
                            >
                                {isPublic
                                    ? 'Pública · visible en la web'
                                    : 'Privada · solo tú puedes verla'}
                            </TextMalet>
                        </TouchableOpacity>
                        <View style={styles.rule} />

                        {content.trim() ? (
                            <MarkdownView
                                content={content}
                                linkMap={linkMap}
                                onOpenNote={openLinkedNote}
                                onCreateNote={createLinkedNote}
                            />
                        ) : (
                            <TextMalet style={styles.emptyNote}>
                                Esta nota está vacía. Toca el lápiz para empezar a escribir.
                            </TextMalet>
                        )}

                        {note.links.length > 0 && (
                            <View style={styles.section}>
                                <TextMalet style={styles.sectionTitle}>
                                    Enlaces
                                </TextMalet>
                                <View style={styles.chips}>
                                    {note.links.map((link) => {
                                        const resolved = !!link.target_note_id;
                                        return (
                                            <TouchableOpacity
                                                key={`${link.raw_title}-${link.alias ?? ''}`}
                                                style={[
                                                    styles.chip,
                                                    !resolved && styles.chipPending,
                                                ]}
                                                onPress={() => {
                                                    if (link.target_note_id) {
                                                        openLinkedNote(
                                                            link.target_note_id
                                                        );
                                                    } else {
                                                        createLinkedNote(
                                                            link.raw_title
                                                        );
                                                    }
                                                }}
                                                activeOpacity={0.75}
                                            >
                                                <TextMalet
                                                    style={[
                                                        styles.chipText,
                                                        !resolved &&
                                                            styles.chipTextPending,
                                                    ]}
                                                >
                                                    {link.alias || link.raw_title}
                                                </TextMalet>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {note.backlinks.length > 0 && (
                            <View style={styles.section}>
                                <TextMalet style={styles.sectionTitle}>
                                    Mencionada en
                                </TextMalet>
                                {note.backlinks.map((backlink) => (
                                    <TouchableOpacity
                                        key={backlink.id}
                                        style={styles.backlinkRow}
                                        onPress={() =>
                                            openLinkedNote(backlink.id)
                                        }
                                        activeOpacity={0.75}
                                    >
                                        <TextMalet
                                            style={styles.backlinkTitle}
                                            numberOfLines={1}
                                        >
                                            {noteTitle(backlink)}
                                        </TextMalet>
                                        <TextMalet
                                            style={styles.backlinkExcerpt}
                                            numberOfLines={1}
                                        >
                                            {backlink.excerpt || 'Sin contenido'}
                                        </TextMalet>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {graphNodes.length > 0 && (
                            <View style={styles.section}>
                                <TextMalet style={styles.sectionTitle}>
                                    Mapa local
                                </TextMalet>
                                <LocalGraph
                                    nodes={graphNodes}
                                    onOpen={openLinkedNote}
                                />
                            </View>
                        )}

                        <Button
                            text="Editar nota"
                            onPress={() => startEditing(blocks.length - 1)}
                            style={styles.editButton}
                        />
                    </ScrollView>
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.editContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TextInput
                            style={styles.titleInput}
                            value={title}
                            onChangeText={(text) => {
                                setTitle(text);
                                markDirty();
                            }}
                            placeholder="Sin título"
                            placeholderTextColor="#c4c4c4"
                            autoFocus={!id}
                            maxLength={255}
                            selectionColor="#2383e2"
                            onSubmitEditing={() => startEditing(0)}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />

                        {blocks.map((block, index) =>
                            index === activeBlock ? (
                                <TextInput
                                    key={`input-${index}`}
                                    ref={(ref) => {
                                        inputsRef.current[index] = ref;
                                    }}
                                    style={[
                                        styles.blockInput,
                                        isMultilineBlock(block) && styles.multilineInput,
                                    ]}
                                    value={block}
                                    onChangeText={(text) => handleBlockChange(index, text)}
                                    multiline
                                    scrollEnabled={false}
                                    textAlignVertical="top"
                                    selection={blockSelection}
                                    onSelectionChange={(event) =>
                                        setBlockSelection(event.nativeEvent.selection)
                                    }
                                    onKeyPress={(event) => {
                                        if (
                                            event.nativeEvent.key === 'Backspace' &&
                                            block === ''
                                        ) {
                                            mergeWithPrevious(index);
                                        }
                                    }}
                                    placeholder={
                                        blocks.length === 1 && !title ? 'Escribe algo…' : ''
                                    }
                                    placeholderTextColor="#b0b0b0"
                                    maxLength={100000}
                                    selectionColor="#2383e2"
                                />
                            ) : (
                                <TouchableOpacity
                                    key={`block-${index}`}
                                    activeOpacity={0.75}
                                    onPress={() => startEditing(index)}
                                >
                                    {block.trim() ? (
                                        <MarkdownView
                                            content={block}
                                            linkMap={linkMap}
                                            onOpenNote={openLinkedNote}
                                            onCreateNote={createLinkedNote}
                                        />
                                    ) : (
                                        <View style={styles.emptyBlock} />
                                    )}
                                </TouchableOpacity>
                            )
                        )}
                    </ScrollView>
                )}

                {mode === 'edit' && (
                    <View
                        style={[
                            styles.bottomBar,
                            {
                                // Con el teclado abierto no hace falta el inset;
                                // cerrado, respeta la barra de navegación del sistema.
                                paddingBottom: keyboardVisible
                                    ? Platform.OS === 'ios'
                                        ? 8
                                        : 6
                                    : Platform.OS === 'android'
                                      ? Math.max(insets.bottom, 6)
                                      : 8,
                            },
                        ]}
                    >
                        <MarkdownToolbar onAction={applyFormat} />
                    </View>
                )}
            </KeyboardAvoidingView>

            {linkPickerOpen && (
                <NoteLinkPickerModal
                    visible
                    initialQuery={linkQuery}
                    excludeId={id}
                    onClose={() => setLinkPickerOpen(false)}
                    onSelect={(target) => insertWikiLink(target.title)}
                    onCreate={(title) => void createAndInsertLink(title)}
                />
            )}
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 5,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        padding: 8,
    },
    saveButton: {
        padding: 8,
        marginRight: 2,
    },
    editHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    tutorialAction: {
        padding: 8,
    },
    saveButtonDisabled: {
        opacity: 0.35,
    },
    scroll: {
        flex: 1,
    },
    bottomBar: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0ef',
        backgroundColor: '#fff',
        paddingTop: 5,
        paddingBottom: Platform.OS === 'ios' ? 8 : 6,
        paddingHorizontal: 2,
    },
    viewContent: {
        paddingBottom: 48,
        paddingTop: 10,
    },
    noteTitle: {
        fontSize: 28,
        lineHeight: 35,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.6,
    },
    meta: {
        fontSize: 11.5,
        color: '#9a9a9a',
        marginTop: 6,
    },
    visibilityPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        marginTop: 8,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: '#f4f4f3',
    },
    visibilityPillPublic: {
        backgroundColor: '#eef7f1',
    },
    visibilityPillText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: '#6b6b6b',
    },
    visibilityPillTextPublic: {
        color: '#2f8f5b',
    },
    rule: {
        height: 1,
        backgroundColor: '#ececeb',
        marginVertical: 16,
    },
    emptyNote: {
        fontSize: 14,
        color: '#9a9a9a',
        lineHeight: 21,
    },
    editButton: {
        marginTop: 28,
        alignSelf: 'flex-start',
    },
    section: {
        marginTop: 24,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11.5,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
    },
    chipPending: {
        borderStyle: 'dashed',
        borderColor: '#cfcfcf',
        backgroundColor: '#fafafa',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0b6e99',
    },
    chipTextPending: {
        color: '#8a8a8a',
    },
    backlinkRow: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 2,
    },
    backlinkTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    backlinkExcerpt: {
        fontSize: 11.5,
        color: '#8a8a8a',
    },
    editContent: {
        paddingBottom: 24,
        paddingTop: 12,
    },
    titleInput: {
        fontSize: 28,
        lineHeight: 35,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.6,
        padding: 0,
        paddingTop: 4,
        marginBottom: 12,
    },
    blockInput: {
        minHeight: 24,
        fontSize: 15,
        lineHeight: 24,
        color: '#37352f',
        padding: 0,
        marginBottom: 10,
    },
    multilineInput: {
        fontFamily: MONO,
        fontSize: 13,
        lineHeight: 20,
        color: '#1f1f1f',
        backgroundColor: '#f7f6f3',
        borderRadius: 8,
        padding: 10,
    },
    emptyBlock: {
        height: 22,
    },
    skeleton: {
        gap: 12,
        paddingTop: 12,
    },
});
