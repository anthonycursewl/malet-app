import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Check, Pencil, Pin, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import { notify, notifyUndo } from '@/components/cuaderno/format';
import MarkdownToolbar, { MarkdownAction } from '@/components/notes/MarkdownToolbar';
import MarkdownView from '@/components/notes/MarkdownView';
import NotesHeader from '@/components/notes/NotesHeader';
import {
    formatNoteDate,
    Note,
    noteTitle,
    noteWordCount,
} from '@/shared/entities/Note';
import { useNotesStore } from '@/shared/stores/useNotesStore';

/**
 * Vista y editor de una nota. Las existentes abren en modo lectura (Markdown
 * renderizado) y las nuevas directo en edición. Al editar una existente hay
 * autosave con debounce.
 */
export default function NoteScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const navigation = useNavigation();

    const fetchNote = useNotesStore((s) => s.fetchNote);
    const createNote = useNotesStore((s) => s.createNote);
    const updateNote = useNotesStore((s) => s.updateNote);
    const deleteNote = useNotesStore((s) => s.deleteNote);
    const restoreNote = useNotesStore((s) => s.restoreNote);

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [mode, setMode] = useState<'view' | 'edit'>(id ? 'view' : 'edit');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [pinned, setPinned] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [preview, setPreview] = useState(false);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const contentRef = useRef<TextInput>(null);
    const savingRef = useRef(false);
    const pendingRef = useRef(false);
    const versionRef = useRef(0);
    const allowExit = useRef(false);
    const persistRef = useRef<() => Promise<boolean>>(async () => false);

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
            setNote(fetched);
            setTitle(fetched.title);
            setContent(fetched.content);
            setPinned(fetched.pinned);
            setLoading(false);
            setMode('view');
        })();
        return () => {
            mounted = false;
        };
    }, [id, fetchNote]);

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
                });
                if (error || !updated) {
                    notify('error', error ?? 'No se pudo guardar la nota.');
                    return false;
                }
                setNote(updated);
                if (versionRef.current === version) setDirty(false);
                setSavedAt(new Date());
                return true;
            }

            const { note: created, error } = await createNote({
                title,
                content,
                pinned,
            });
            if (error || !created) {
                notify('error', error ?? 'No se pudo crear la nota.');
                return false;
            }
            setNote(created);
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
    }, [id, title, content, pinned, updateNote, createNote]);

    // El guardado pendiente siempre usa la versión más reciente del formulario.
    useEffect(() => {
        persistRef.current = persist;
    }, [persist]);

    // Autosave solo para notas ya existentes y en modo edición.
    useEffect(() => {
        if (!id || mode !== 'edit' || !dirty) return;
        const timer = setTimeout(() => {
            void persist();
        }, 900);
        return () => clearTimeout(timer);
    }, [id, mode, dirty, title, content, pinned, persist]);

    // Guardia al salir con cambios sin guardar (botón atrás o gesto).
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
        if (updated) setNote(updated);
        notify('success', next ? 'Nota fijada.' : 'Nota desfijada.');
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

    const updateContent = (
        next: string,
        nextSelection?: { start: number; end: number }
    ) => {
        setContent(next);
        markDirty();
        if (nextSelection) {
            setSelection(nextSelection);
            requestAnimationFrame(() => contentRef.current?.focus());
        }
    };

    const wrapSelection = (before: string, after: string) => {
        const { start, end } = selection;
        const selected = content.slice(start, end);
        const next =
            content.slice(0, start) + before + selected + after + content.slice(end);
        const cursor = start + before.length;
        updateContent(next, { start: cursor, end: cursor + selected.length });
    };

    const toggleLinePrefix = (prefix: string) => {
        const { start, end } = selection;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = content.indexOf('\n', end);
        if (lineEnd === -1) lineEnd = content.length;
        const line = content.slice(lineStart, lineEnd);

        if (line.startsWith(prefix)) {
            const next =
                content.slice(0, lineStart) +
                line.slice(prefix.length) +
                content.slice(lineEnd);
            const shift = Math.min(prefix.length, start - lineStart);
            updateContent(next, {
                start: Math.max(lineStart, start - shift),
                end: Math.max(lineStart, end - prefix.length),
            });
            return;
        }

        const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
        updateContent(next, {
            start: start + prefix.length,
            end: end + prefix.length,
        });
    };

    const toggleHeading = (prefix: string) => {
        const { start, end } = selection;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = content.indexOf('\n', end);
        if (lineEnd === -1) lineEnd = content.length;
        const line = content.slice(lineStart, lineEnd);
        const existing = line.match(/^#{1,6}\s+/);

        if (existing && existing[0] === prefix) {
            const next =
                content.slice(0, lineStart) +
                line.slice(existing[0].length) +
                content.slice(lineEnd);
            const shift = Math.min(existing[0].length, start - lineStart);
            updateContent(next, {
                start: Math.max(lineStart, start - shift),
                end: Math.max(lineStart, end - existing[0].length),
            });
            return;
        }

        const base = existing ? line.slice(existing[0].length) : line;
        const next = content.slice(0, lineStart) + prefix + base + content.slice(lineEnd);
        const delta = prefix.length - (existing ? existing[0].length : 0);
        updateContent(next, { start: start + delta, end: end + delta });
    };

    const applyFormat = (action: MarkdownAction) => {
        const { start, end } = selection;

        switch (action) {
            case 'bold':
                return wrapSelection('**', '**');
            case 'italic':
                return wrapSelection('_', '_');
            case 'h1':
                return toggleHeading('# ');
            case 'h2':
                return toggleHeading('## ');
            case 'bullet':
                return toggleLinePrefix('- ');
            case 'check':
                return toggleLinePrefix('- [ ] ');
            case 'quote':
                return toggleLinePrefix('> ');
            case 'codeblock': {
                const insert = '\n```\n\n```\n';
                const next =
                    content.slice(0, start) + insert + content.slice(end);
                const cursor = start + 5;
                return updateContent(next, { start: cursor, end: cursor });
            }
            case 'divider': {
                const insert = '\n\n---\n\n';
                const next =
                    content.slice(0, start) + insert + content.slice(end);
                const cursor = start + insert.length;
                return updateContent(next, { start: cursor, end: cursor });
            }
            case 'link': {
                const label = content.slice(start, end) || 'texto';
                const insert = `[${label}](https://)`;
                const urlOffset = insert.indexOf('https://');
                const next =
                    content.slice(0, start) + insert + content.slice(end);
                return updateContent(next, {
                    start: start + urlOffset,
                    end: start + urlOffset + 8,
                });
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
              ? `${formatNoteDate(note.updated_at)} · ${noteWordCount(note.content)} palabras`
              : undefined;

    const headerRight =
        mode === 'edit' ? (
            <TouchableOpacity
                style={styles.saveButton}
                onPress={saveNow}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityLabel="Guardar nota"
            >
                <Check size={18} color="#fff" />
            </TouchableOpacity>
        ) : (
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={togglePin}>
                    <Pin
                        size={18}
                        color={pinned ? '#b45309' : '#555'}
                        fill={pinned ? '#b45309' : 'transparent'}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setMode('edit')}>
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <NotesHeader
                    title={mode === 'edit' ? (note ? 'Editar nota' : 'Nueva nota') : noteTitle({ title })}
                    subtitle={headerSubtitle}
                    right={headerRight}
                />

                {mode === 'view' && note ? (
                    <ScrollView
                        contentContainerStyle={styles.viewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <TextMalet style={styles.noteTitle}>{noteTitle({ title })}</TextMalet>
                        <TextMalet style={styles.meta}>
                            {formatNoteDate(note.updated_at)} · {noteWordCount(content)}{' '}
                            palabras
                        </TextMalet>
                        <View style={styles.rule} />

                        {content.trim() ? (
                            <MarkdownView content={content} />
                        ) : (
                            <TextMalet style={styles.emptyNote}>
                                Esta nota está vacía. Toca el lápiz para empezar a escribir.
                            </TextMalet>
                        )}

                        <Button
                            text="Editar nota"
                            onPress={() => setMode('edit')}
                            style={styles.editButton}
                        />
                    </ScrollView>
                ) : (
                    <ScrollView
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
                        />

                        <View style={styles.modeRow}>
                            <TouchableOpacity
                                style={[styles.modeChip, !preview && styles.modeChipActive]}
                                onPress={() => setPreview(false)}
                            >
                                <TextMalet
                                    style={[
                                        styles.modeChipText,
                                        !preview && styles.modeChipTextActive,
                                    ]}
                                >
                                    Escribir
                                </TextMalet>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeChip, preview && styles.modeChipActive]}
                                onPress={() => setPreview(true)}
                            >
                                <TextMalet
                                    style={[
                                        styles.modeChipText,
                                        preview && styles.modeChipTextActive,
                                    ]}
                                >
                                    Vista previa
                                </TextMalet>
                            </TouchableOpacity>
                        </View>

                        {preview ? (
                            <View style={styles.previewBox}>
                                <MarkdownView
                                    content={content || '_Nada todavía. Escribe algo en Markdown._'}
                                />
                            </View>
                        ) : (
                            <>
                                <MarkdownToolbar onAction={applyFormat} />
                                <TextInput
                                    ref={contentRef}
                                    style={styles.contentInput}
                                    value={content}
                                    onChangeText={(text) => {
                                        setContent(text);
                                        markDirty();
                                    }}
                                    placeholder="Escribe en Markdown…"
                                    placeholderTextColor="#b0b0b0"
                                    multiline
                                    textAlignVertical="top"
                                    scrollEnabled={false}
                                    selection={selection}
                                    onSelectionChange={(event) =>
                                        setSelection(event.nativeEvent.selection)
                                    }
                                    maxLength={100000}
                                />
                            </>
                        )}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
    },
    viewContent: {
        paddingBottom: 48,
        paddingTop: 4,
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
    editContent: {
        paddingBottom: 80,
        paddingTop: 2,
    },
    titleInput: {
        fontSize: 28,
        lineHeight: 35,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.6,
        padding: 0,
        marginBottom: 12,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    modeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
    },
    modeChipActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    modeChipText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#6b6b6b',
    },
    modeChipTextActive: {
        color: '#fff',
    },
    previewBox: {
        borderWidth: 1,
        borderColor: '#ececeb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
        minHeight: 240,
    },
    contentInput: {
        minHeight: 320,
        fontSize: 15,
        lineHeight: 23,
        color: '#37352f',
        padding: 0,
        marginTop: 4,
        fontFamily: Platform.select({
            ios: 'Menlo',
            android: 'monospace',
            default: 'monospace',
        }),
    },
    skeleton: {
        gap: 12,
        paddingTop: 12,
    },
});
