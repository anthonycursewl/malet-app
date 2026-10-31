import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { BookOpen, CircleHelp, Network, Plus, Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated, {
    LAYOUT_HORIZONTAL_PADDING,
} from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import NoteFeedSkeleton from '@/components/notes/NoteFeedSkeleton';
import { notify, notifyUndo } from '@/components/cuaderno/format';
import NoteCard from '@/components/notes/NoteCard';
import NotesHeader from '@/components/notes/NotesHeader';
import {
    TUTORIAL_NOTE_CONTENT,
    TUTORIAL_NOTE_TITLE,
} from '@/components/notes/tutorialNote';
import { noteTitle, NoteSummary } from '@/shared/entities/Note';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useNotesStore } from '@/shared/stores/useNotesStore';

/** Listado de notas con búsqueda, paginación cursor y acceso rápido al editor. */
export default function NotesListScreen() {
    const notes = useNotesStore((s) => s.notes);
    const notesLoading = useNotesStore((s) => s.notesLoading);
    const notesLoadingMore = useNotesStore((s) => s.notesLoadingMore);
    const notesError = useNotesStore((s) => s.notesError);
    const search = useNotesStore((s) => s.search);
    const loadNotes = useNotesStore((s) => s.loadNotes);
    const setSearch = useNotesStore((s) => s.setSearch);
    const clearNotesError = useNotesStore((s) => s.clearNotesError);
    const createNote = useNotesStore((s) => s.createNote);
    const togglePin = useNotesStore((s) => s.togglePin);
    const deleteNote = useNotesStore((s) => s.deleteNote);
    const restoreNote = useNotesStore((s) => s.restoreNote);
    const author = useAuthStore((s) => s.user);

    const [searchText, setSearchText] = useState(search);
    const [creatingTutorial, setCreatingTutorial] = useState(false);

    // Al volver del editor, la lista se refresca (título/extracto/orden).
    useFocusEffect(
        useCallback(() => {
            void loadNotes({ refresh: true });
        }, [loadNotes])
    );

    // Carga la ruta de ayuda en segundo plano para que el tap sea inmediato.
    useEffect(() => {
        router.prefetch('/notes/help' as any);
    }, []);

    // Búsqueda con debounce para no pedir en cada tecla.
    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmed = searchText.trim();
            if (trimmed !== search) void setSearch(trimmed);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText, search, setSearch]);

    useEffect(() => {
        if (!notesError) return;
        notify('error', notesError);
        clearNotesError();
    }, [notesError, clearNotesError]);

    const openNote = useCallback((note: NoteSummary) => {
        router.push({ pathname: '/notes/note', params: { id: note.id } } as any);
    }, []);

    const handleTogglePin = useCallback(
        async (note: NoteSummary) => {
            const error = await togglePin(note);
            if (error) notify('error', error);
        },
        [togglePin]
    );

    const handleArchive = useCallback(
        (note: NoteSummary) => {
            Alert.alert(
                'Archivar nota',
                `¿Quieres archivar «${noteTitle(note)}»? Podrás deshacerlo.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Archivar',
                        style: 'destructive',
                        onPress: async () => {
                            const error = await deleteNote(note.id);
                            if (error) {
                                notify('error', error);
                                return;
                            }
                            notifyUndo('Nota archivada.', () => {
                                void restoreNote(note.id);
                            });
                        },
                    },
                ]
            );
        },
        [deleteNote, restoreNote]
    );

    /** Crea la nota tutorial una vez; si ya existe, la abre. */
    const openTutorial = async () => {
        if (creatingTutorial) return;

        const existing = useNotesStore
            .getState()
            .notes.find((note) => note.title === TUTORIAL_NOTE_TITLE);
        if (existing) {
            openNote(existing);
            return;
        }

        setCreatingTutorial(true);
        const { note, error } = await createNote({
            title: TUTORIAL_NOTE_TITLE,
            content: TUTORIAL_NOTE_CONTENT,
            pinned: true,
        });
        setCreatingTutorial(false);

        if (error || !note) {
            notify('error', error ?? 'No se pudo crear la nota tutorial.');
            return;
        }

        notify('success', 'Nota tutorial creada.');
        router.push({ pathname: '/notes/note', params: { id: note.id } } as any);
    };

    const renderItem = useCallback(
        ({ item }: { item: NoteSummary }) => (
            <NoteCard
                note={item}
                author={author}
                onOpen={openNote}
                onTogglePin={handleTogglePin}
                onArchive={handleArchive}
            />
        ),
        [author, openNote, handleTogglePin, handleArchive]
    );

    const header = (
        <View style={styles.headerBlock}>
            <InputField
                label="Buscar"
                placeholder="Buscar en tus notas..."
                value={searchText}
                onChangeText={setSearchText}
                icon={<Search size={16} color="#666" />}
                autoCapitalize="none"
            />
        </View>
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <NotesHeader
                    title="Notas"
                    subtitle="Markdown, ideas y apuntes"
                    right={
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.mapButton}
                                onPress={() =>
                                    router.push('/notes/help' as any)
                                }
                                activeOpacity={0.7}
                                accessibilityLabel="Ayuda de Notas"
                            >
                                <CircleHelp size={17} color="#555" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.mapButton}
                                onPress={() =>
                                    router.push('/notes/graph' as any)
                                }
                                activeOpacity={0.7}
                                accessibilityLabel="Mapa de notas"
                            >
                                <Network size={17} color="#555" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.tutorialButton}
                                onPress={openTutorial}
                                disabled={creatingTutorial || notesLoading}
                                activeOpacity={0.7}
                                accessibilityLabel="Crear nota tutorial"
                            >
                                {creatingTutorial ? (
                                    <ActivityIndicator size="small" color="#555" />
                                ) : (
                                    <>
                                        <BookOpen size={16} color="#555" />
                                        <TextMalet style={styles.tutorialText}>
                                            Tutorial
                                        </TextMalet>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    }
                />

                <FlashList
                    style={styles.list}
                    data={notes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onEndReachedThreshold={0.4}
                    onEndReached={() => {
                        if (
                            notes.length > 0 &&
                            !notesLoadingMore &&
                            !notesLoading
                        ) {
                            void loadNotes({ refresh: false });
                        }
                    }}
                    onRefresh={() => loadNotes({ refresh: true, useCache: false })}
                    refreshing={notesLoading && notes.length > 0}
                    ListFooterComponent={
                        notesLoadingMore ? (
                            <View
                                accessible
                                accessibilityLabel="Cargando más notas"
                            >
                                <NoteFeedSkeleton rows={2} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        notesLoading ? (
                            <NoteFeedSkeleton rows={6} />
                        ) : search ? (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>
                                    Sin resultados
                                </TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    No encontramos notas con «{search}».
                                </TextMalet>
                            </View>
                        ) : (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>
                                    Aún no hay notas
                                </TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    Escribe ideas, recetas o apuntes en Markdown. Se ven
                                    con un estilo limpio, tipo Notion.
                                </TextMalet>
                                <Button
                                    text="Crear mi primera nota"
                                    onPress={() =>
                                        router.push('/notes/note' as any)
                                    }
                                    style={styles.emptyButton}
                                />
                            </View>
                        )
                    }
                />

                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.85}
                    onPress={() => router.push('/notes/note' as any)}
                    accessibilityLabel="Nueva nota"
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    list: {
        flex: 1,
        // Compensa el padding horizontal de LayoutAuthenticated: el feed
        // ocupa todo el ancho y el padding queda dentro de cada post.
        marginHorizontal: -LAYOUT_HORIZONTAL_PADDING,
    },
    headerBlock: {
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    tutorialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    mapButton: {
        padding: 8,
    },
    tutorialText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    listContent: {
        paddingBottom: 110,
    },
    empty: {
        alignItems: 'center',
        marginTop: 56,
        gap: 8,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    emptyText: {
        fontSize: 13,
        color: '#8a8a8a',
        textAlign: 'center',
        lineHeight: 19,
    },
    emptyButton: {
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
});
