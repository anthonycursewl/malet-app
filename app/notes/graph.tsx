import { router, useFocusEffect } from 'expo-router';
import { Network, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import { notify } from '@/components/cuaderno/format';
import KnowledgeGraph from '@/components/notes/KnowledgeGraph';
import NotesHeader from '@/components/notes/NotesHeader';
import { NoteGraph } from '@/shared/entities/Note';
import { notesService } from '@/shared/services/notes/notes.service';

/** Mapa global de conocimiento: notas (nodos) y `[[enlaces]]` (aristas). */
export default function NotesGraphScreen() {
    const { width, height } = useWindowDimensions();
    const [graph, setGraph] = useState<NoteGraph | null>(null);
    const [loading, setLoading] = useState(true);

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

    const graphWidth = Math.max(240, width - 28);
    const graphHeight = Math.max(380, Math.min(620, height - 230));

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
                            <SkeletonBlock w="100%" h={graphHeight} r={14} />
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
                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.graphCard}>
                            <KnowledgeGraph
                                graph={graph}
                                width={graphWidth}
                                height={graphHeight}
                                onOpen={openNote}
                            />
                        </View>

                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.dot,
                                        { borderColor: '#b45309', backgroundColor: '#fff7ed' },
                                    ]}
                                />
                                <TextMalet style={styles.legendText}>
                                    Fijada
                                </TextMalet>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={styles.dot} />
                                <TextMalet style={styles.legendText}>
                                    Nota
                                </TextMalet>
                            </View>
                        </View>

                        <TextMalet style={styles.hint}>
                            Toca un nodo para abrir la nota.
                            {graph.edges.length === 0
                                ? ' Aún no hay enlaces: usa [[Título]] en el editor.'
                                : ''}
                        </TextMalet>
                        {graph.truncated && (
                            <TextMalet style={styles.hint}>
                                Mostrando las 300 notas más recientes.
                            </TextMalet>
                        )}
                    </ScrollView>
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
        paddingBottom: 40,
        gap: 10,
    },
    graphCard: {
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
