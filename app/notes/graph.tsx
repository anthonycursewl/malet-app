import { router, useFocusEffect } from 'expo-router';
import { Network, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import { notify } from '@/components/cuaderno/format';
import GraphCanvas from '@/components/notes/GraphCanvas';
import NotesHeader from '@/components/notes/NotesHeader';
import { NoteGraph } from '@/shared/entities/Note';
import { notesService } from '@/shared/services/notes/notes.service';

/** Mapa global de conocimiento: notas (nodos) y `[[enlaces]]` (aristas). */
export default function NotesGraphScreen() {
    const [graph, setGraph] = useState<NoteGraph | null>(null);
    const [loading, setLoading] = useState(true);
    const [canvas, setCanvas] = useState({ width: 0, height: 0 });

    const load = useCallback(async () => {
        setLoading(true);
        const { error, response } = await notesService.getGraph();
        if (error || !response) {
            setLoading(false);
            notify('error', error ?? 'No se pudo cargar el mapa.');
            return;
        }

        setGraph(response);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load])
    );

    const openNote = (id: string) => {
        router.push({ pathname: '/notes/note', params: { id } } as any);
    };

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <NotesHeader
                    title="Mapa de notas"
                    subtitle={
                        graph
                            ? `${graph.nodes.length} notas · ${graph.edges.length} enlaces`
                            : 'Tu cerebro de conocimiento'
                    }
                    right={
                        <TouchableOpacity
                            style={styles.refresh}
                            onPress={() => void load()}
                            disabled={loading}
                            activeOpacity={0.6}
                            accessibilityLabel="Actualizar mapa"
                        >
                            <RefreshCw size={18} color="#555" />
                        </TouchableOpacity>
                    }
                />

                {loading ? (
                    <SkeletonShimmer>
                        <View style={styles.skeleton}>
                            <SkeletonBlock w="100%" h={420} r={14} />
                        </View>
                    </SkeletonShimmer>
                ) : !graph || graph.nodes.length === 0 ? (
                    <View style={styles.empty}>
                        <Network size={30} color="#c4c4c4" />
                        <TextMalet style={styles.emptyTitle}>
                            Aún no hay notas
                        </TextMalet>
                        <TextMalet style={styles.emptyText}>
                            Crea notas y enlázalas con `[[...]]` para empezar a
                            construir tu mapa.
                        </TextMalet>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View
                            style={styles.graphCard}
                            onLayout={(event) => {
                                const { width, height } =
                                    event.nativeEvent.layout;
                                if (
                                    width !== canvas.width ||
                                    height !== canvas.height
                                ) {
                                    setCanvas({ width, height });
                                }
                            }}
                        >
                            {canvas.width > 0 && canvas.height > 0 && (
                                <GraphCanvas
                                    graph={graph}
                                    width={canvas.width}
                                    height={canvas.height}
                                    onOpen={openNote}
                                />
                            )}
                        </View>

                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            borderColor: '#b45309',
                                            backgroundColor: '#fff7ed',
                                        },
                                    ]}
                                />
                                <TextMalet style={styles.legendText}>
                                    Fijada
                                </TextMalet>
                            </View>
                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            borderColor: '#2f8f5b',
                                            backgroundColor: '#eef7f1',
                                        },
                                    ]}
                                />
                                <TextMalet style={styles.legendText}>
                                    Pública
                                </TextMalet>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={styles.dot} />
                                <TextMalet style={styles.legendText}>
                                    Privada
                                </TextMalet>
                            </View>
                        </View>

                        <TextMalet style={styles.hint}>
                            Arrastra para mover, pellizca para zoom y toca un
                            nodo para ver sus conexiones. Toca otra vez para
                            abrirlo. Al acercarte aparecen más etiquetas y los
                            nodos mantienen un tamaño legible.
                        </TextMalet>
                        {graph.edges.length === 0 && (
                            <TextMalet style={styles.hint}>
                                Aún no hay enlaces: usa [[Título]] en el editor.
                            </TextMalet>
                        )}
                        {graph.truncated && (
                            <TextMalet style={styles.hint}>
                                Mostrando las 500 notas más recientes.
                            </TextMalet>
                        )}
                    </View>
                )}
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    refresh: {
        padding: 8,
    },
    content: {
        flex: 1,
        gap: 8,
        paddingBottom: 8,
    },
    graphCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ececeb',
        borderRadius: 14,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    skeleton: {
        paddingTop: 8,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.2,
        borderColor: '#6b6b6b',
        backgroundColor: '#fff',
    },
    legendText: {
        fontSize: 11,
        color: '#6b6b6b',
        fontWeight: '600',
    },
    hint: {
        fontSize: 11.5,
        color: '#9a9a9a',
        lineHeight: 16,
        paddingHorizontal: 4,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 32,
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
});
