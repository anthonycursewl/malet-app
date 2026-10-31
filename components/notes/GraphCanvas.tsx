import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
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
    };

    const reset = () => {
        translateX.set(withTiming(0, { duration: 200 }));
        translateY.set(withTiming(0, { duration: 200 }));
        scale.set(withTiming(1, { duration: 200 }));
        savedX.set(0);
        savedY.set(0);
        savedScale.set(1);
    };

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
                            width={width}
                            height={height}
                            onOpen={onOpen}
                        />
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>

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
