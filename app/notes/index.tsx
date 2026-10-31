import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { ListRowsSkeleton } from '@/components/cuaderno/Skeletons';
import { notify } from '@/components/cuaderno/format';
import NoteCard from '@/components/notes/NoteCard';
import NotesHeader from '@/components/notes/NotesHeader';
import { NoteSummary } from '@/shared/entities/Note';
import { useNotesStore } from '@/shared/stores/useNotesStore';

/** Listado de notas con búsqueda, paginación cursor y acceso rápido al editor. */
export default function NotesListScreen() {
    const notes = useNotesStore((s) => s.notes);
    const notesLoading = useNotesStore((s) => s.notesLoading);
    const notesError = useNotesStore((s) => s.notesError);
    const search = useNotesStore((s) => s.search);
    const loadNotes = useNotesStore((s) => s.loadNotes);
    const setSearch = useNotesStore((s) => s.setSearch);
    const clearNotesError = useNotesStore((s) => s.clearNotesError);

    const [searchText, setSearchText] = useState(search);

    // Al volver del editor, la lista se refresca (título/extracto/orden).
    useFocusEffect(
        useCallback(() => {
            void loadNotes({ refresh: true });
        }, [loadNotes])
    );

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

    const renderItem = useCallback(
        ({ item }: { item: NoteSummary }) => (
            <NoteCard note={item} onPress={openNote} />
        ),
        [openNote]
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
                />

                <FlashList
                    data={notes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadNotes({ refresh: false })}
                    onRefresh={() => loadNotes({ refresh: true, useCache: false })}
                    refreshing={notesLoading && notes.length > 0}
                    ListEmptyComponent={
                        notesLoading ? (
                            <ListRowsSkeleton rows={5} />
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
        paddingHorizontal: 5,
    },
    headerBlock: {
        paddingBottom: 10,
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
