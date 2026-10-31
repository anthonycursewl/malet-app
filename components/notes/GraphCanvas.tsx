import {
    Globe,
    LocateFixed,
    Lock,
    Minus,
    Plus,
} from 'lucide-react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
    runOnJS,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import TextMalet from '@/components/TextMalet/TextMalet';
import KnowledgeGraph, {
    graphStructureKey,
} from './KnowledgeGraph';
import type { ScreenNode, SkiaGraphProps } from './graph/SkiaGraph';
import { useGraphLayout } from './graph/useGraphLayout';
import { nodeScreenRadius } from './graph/graphMath';
import { NoteGraph } from '@/shared/entities/Note';

interface GraphCanvasProps {
    graph: NoteGraph;
    width: number;
    height: number;
    onOpen: (id: string) => void;
}

interface Viewport {
    scale: number;
    x: number;
    y: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
type SkiaGraphComponentType = ComponentType<SkiaGraphProps>;

/**
 * Skia no está incluido en todos los binarios de Expo Go/development builds.
 * Se carga de forma protegida; si el módulo nativo no existe, se usa el SVG.
 */
let SkiaGraphComponent: SkiaGraphComponentType | null = null;
if (Platform.OS !== 'web') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const skia = require('@shopify/react-native-skia');
        if (skia?.Canvas) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const module = require('./graph/SkiaGraph');
            SkiaGraphComponent =
                module.default as SkiaGraphComponentType;
        }
    } catch (error) {
        if (__DEV__) {
            console.warn(
                '[notes/graph] Skia no está disponible en este binario; usando SVG.',
                error
            );
        }
    }
}

const USE_SKIA_GRAPH =
    Platform.OS !== 'web' && SkiaGraphComponent !== null;

/**
 * Lienzo del mapa. En nativo dibuja con Skia (GPU); en web conserva el
 * renderer SVG como fallback.
 */
export default function GraphCanvas({
    graph,
    width,
    height,
    onOpen,
}: GraphCanvasProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewport, setViewport] = useState<Viewport>({
        scale: 1,
        x: 0,
        y: 0,
    });
    const structureKey = useMemo(() => graphStructureKey(graph), [graph]);
    const graphLayout = useGraphLayout(graph, USE_SKIA_GRAPH);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);

    const screenNodes = useMemo<ScreenNode[]>(() => {
        if (!graphLayout || !width || !height) return [];
        const fit = Math.min(width, height) / graphLayout.layoutSize;
        const offsetX = (width - graphLayout.layoutSize * fit) / 2;
        const offsetY = (height - graphLayout.layoutSize * fit) / 2;
        const currentById = new Map(
            graph.nodes.map((node) => [node.id, node])
        );

        return graphLayout.nodes.map((node) => {
            const current = currentById.get(node.id);
            return {
                ...node,
                ...(current ?? {}),
                baseX: node.x * fit + offsetX,
                baseY: node.y * fit + offsetY,
            };
        });
    }, [graphLayout, graph.nodes, width, height]);

    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.min(
                MAX_SCALE,
                Math.max(MIN_SCALE, savedScale.value * event.scale)
            );
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(setViewport)({
                scale: scale.value,
                x: translateX.value,
                y: translateY.value,
            });
        });

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = savedX.value + event.translationX;
            translateY.value = savedY.value + event.translationY;
        })
        .onEnd(() => {
            savedX.value = translateX.value;
            savedY.value = translateY.value;
            runOnJS(setViewport)({
                scale: scale.value,
                x: translateX.value,
                y: translateY.value,
            });
        });

    const selectAt = useCallback(
        (
            screenX: number,
            screenY: number,
            currentScale: number,
            currentX: number,
            currentY: number
        ) => {
            if (!screenNodes.length) return;

            const centerX = width / 2;
            const centerY = height / 2;
            let best: { id: string; distance: number } | null = null;

            for (const node of screenNodes) {
                const nodeX =
                    centerX +
                    (node.baseX - centerX) * currentScale +
                    currentX;
                const nodeY =
                    centerY +
                    (node.baseY - centerY) * currentScale +
                    currentY;
                const hitRadius =
                    nodeScreenRadius(
                        node.degree,
                        currentScale,
                        node.id === selectedId
                    ) + 10;
                const distance = Math.hypot(screenX - nodeX, screenY - nodeY);
                if (distance <= hitRadius && (!best || distance < best.distance)) {
                    best = { id: node.id, distance };
                }
            }

            if (!best) return;
            if (best.id === selectedId) {
                onOpen(best.id);
            } else {
                setSelectedId(best.id);
            }
        },
        [screenNodes, width, height, selectedId, onOpen]
    );

    const tap = Gesture.Tap()
        .maxDistance(10)
        .onEnd((event) => {
            runOnJS(selectAt)(
                event.x,
                event.y,
                scale.value,
                translateX.value,
                translateY.value
            );
        });

    const composed = USE_SKIA_GRAPH
        ? Gesture.Simultaneous(pinch, pan, tap)
        : Gesture.Simultaneous(pinch, pan);

    const zoom = (factor: number) => {
        const next = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, scale.get() * factor)
        );
        scale.set(withTiming(next, { duration: 180 }));
        savedScale.set(next);
        setViewport({
            scale: next,
            x: translateX.get(),
            y: translateY.get(),
        });
    };

    const reset = () => {
        translateX.set(withTiming(0, { duration: 200 }));
        translateY.set(withTiming(0, { duration: 200 }));
        scale.set(withTiming(1, { duration: 200 }));
        savedX.set(0);
        savedY.set(0);
        savedScale.set(1);
        setViewport({ scale: 1, x: 0, y: 0 });
        setSelectedId(null);
    };

    const handleSelect = (id: string) => {
        if (selectedId === id) {
            onOpen(id);
            return;
        }
        setSelectedId(id);
    };

    const selectedNode = graph.nodes.find((node) => node.id === selectedId);

    return (
        <View style={[styles.canvas, { width, height }]}>
            {/* Fondo de puntos de baja opacidad */}
            <Svg
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                pointerEvents="none"
            >
                <Defs>
                    <Pattern
                        id="dot-grid"
                        width={20}
                        height={20}
                        patternUnits="userSpaceOnUse"
                    >
                        <Circle
                            cx={2}
                            cy={2}
                            r={1.1}
                            fill="#d9d9d9"
                            opacity={0.5}
                        />
                    </Pattern>
                </Defs>
                <Rect
                    x={0}
                    y={0}
                    width="100%"
                    height="100%"
                    fill="url(#dot-grid)"
                />
            </Svg>

            <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                <GestureDetector gesture={composed}>
                    <View style={StyleSheet.absoluteFill}>
                        {USE_SKIA_GRAPH && SkiaGraphComponent ? (
                            graphLayout ? (
                                <SkiaGraphComponent
                                    nodes={screenNodes}
                                    edges={graphLayout.edges}
                                    width={width}
                                    height={height}
                                    scale={scale}
                                    translateX={translateX}
                                    translateY={translateY}
                                    viewport={viewport}
                                    selectedId={selectedId}
                                />
                            ) : (
                                <View style={styles.loading}>
                                    <ActivityIndicator
                                        size="small"
                                        color="#6b6b6b"
                                    />
                                    <TextMalet style={styles.loadingText}>
                                        Calculando mapa…
                                    </TextMalet>
                                </View>
                            )
                        ) : (
                            <KnowledgeGraph
                                key={structureKey}
                                graph={graph}
                                viewport={viewport}
                                viewportWidth={width}
                                viewportHeight={height}
                                selectedId={selectedId}
                                onSelect={handleSelect}
                            />
                        )}
                    </View>
                </GestureDetector>
            </GestureHandlerRootView>

            {selectedNode && (
                <View
                    style={[styles.selectionCard, { maxWidth: width - 70 }]}
                >
                    <TextMalet
                        style={styles.selectionTitle}
                        numberOfLines={1}
                    >
                        {selectedNode.title.trim() || 'Sin título'}
                    </TextMalet>
                    <View style={styles.selectionVisibility}>
                        {selectedNode.is_public ? (
                            <Globe size={11} color="#2f8f5b" />
                        ) : (
                            <Lock size={11} color="#8a8a8a" />
                        )}
                        <TextMalet
                            style={[
                                styles.selectionVisibilityText,
                                selectedNode.is_public &&
                                    styles.selectionVisibilityPublic,
                            ]}
                        >
                            {selectedNode.is_public ? 'Pública' : 'Privada'}
                        </TextMalet>
                    </View>
                    <TextMalet style={styles.selectionHint}>
                        Toca otra vez para abrir
                    </TextMalet>
                </View>
            )}

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.control}
                    onPress={() => zoom(1.25)}
                    activeOpacity={0.75}
                    accessibilityLabel="Acercar mapa"
                >
                    <Plus size={16} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.control}
                    onPress={() => zoom(0.8)}
                    activeOpacity={0.75}
                    accessibilityLabel="Alejar mapa"
                >
                    <Minus size={16} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.control}
                    onPress={reset}
                    activeOpacity={0.75}
                    accessibilityLabel="Centrar mapa"
                >
                    <LocateFixed size={16} color="#111" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    canvas: {
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#6b6b6b',
    },
    controls: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        gap: 6,
        zIndex: 2,
    },
    selectionCard: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        zIndex: 2,
    },
    selectionVisibility: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    selectionVisibilityText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8a8a8a',
    },
    selectionVisibilityPublic: {
        color: '#2f8f5b',
    },
    selectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    selectionHint: {
        fontSize: 10,
        color: '#9a9a9a',
        marginTop: 1,
    },
    control: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
});
