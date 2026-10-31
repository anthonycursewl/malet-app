import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import TextMalet from '@/components/TextMalet/TextMalet';
import KnowledgeGraph from './KnowledgeGraph';
import { NoteGraph } from '@/shared/entities/Note';

interface GraphCanvasProps {
    graph: NoteGraph;
    width: number;
    height: number;
    onOpen: (id: string) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

/**
 * Canvas del mapa: fondo de puntos fijo + grafo con pan y pinch-zoom.
 * Los botones permiten acercar/alejar/centrar sin gestos.
 */
export default function GraphCanvas({
    graph,
    width,
    height,
    onOpen,
}: GraphCanvasProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.min(
                MAX_SCALE,
                Math.max(MIN_SCALE, savedScale.value * event.scale)
            );
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(setZoomLevel)(scale.value);
        });

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = savedX.value + event.translationX;
            translateY.value = savedY.value + event.translationY;
        })
        .onEnd(() => {
            savedX.value = translateX.value;
            savedY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const zoom = (factor: number) => {
        const next = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, scale.get() * factor)
        );
        scale.set(withTiming(next, { duration: 180 }));
        savedScale.set(next);
        setZoomLevel(next);
    };

    const reset = () => {
        translateX.set(withTiming(0, { duration: 200 }));
        translateY.set(withTiming(0, { duration: 200 }));
        scale.set(withTiming(1, { duration: 200 }));
        savedX.set(0);
        savedY.set(0);
        savedScale.set(1);
        setZoomLevel(1);
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
                    <Animated.View
                        style={[StyleSheet.absoluteFill, animatedStyle]}
                    >
                        <KnowledgeGraph
                            graph={graph}
                            zoomLevel={zoomLevel}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                        />
                    </Animated.View>
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
