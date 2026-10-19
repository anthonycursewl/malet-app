import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, StyleSheet, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

/** Logo blanco de Breadriuss: el que se ve sobre el velo oscuro. */
const LOGO = require('@/assets/images/malet/brd_white_logo.png');

/** Ancho de la banda de brillo que barre el texto. */
const SHIMMER_WIDTH = 140;
const SHIMMER_MS = 1400;

/**
 * Velo negro a pantalla completa mientras se registra la venta: logo de
 * Breadriuss en el centro y, debajo, un candado con “Procesando...” con brillo.
 *
 * Entra con un fundido suave (el `Modal` anima el conjunto) y el contenido
 * aparece con un pequeño realce.
 */
export default function SaleProcessingOverlay({ visible }: { visible: boolean }) {
    const [scale] = useState(() => new Animated.Value(0.92));
    const [opacity] = useState(() => new Animated.Value(0));
    const [progress] = useState(() => new Animated.Value(0));

    // Entrada suave del contenido (la salida la anima el propio Modal).
    useEffect(() => {
        if (!visible) return;

        scale.setValue(0.92);
        opacity.setValue(0);

        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                bounciness: 4,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, scale, opacity]);

    // Barrido del brillo sobre las letras.
    useEffect(() => {
        if (!visible) return;

        progress.setValue(0);
        const loop = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: SHIMMER_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        loop.start();
        return () => loop.stop();
    }, [visible, progress]);

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-SHIMMER_WIDTH, SHIMMER_WIDTH * 2],
    });

    return (
        <Modal
            transparent
            statusBarTranslucent
            animationType="fade"
            visible={visible}
            onRequestClose={() => undefined}
        >
            <View style={styles.backdrop}>
                <Animated.View
                    style={[
                        styles.content,
                        { opacity, transform: [{ scale }] },
                    ]}
                >
                    <Image source={LOGO} style={styles.logo} resizeMode="contain" />

                    <View style={styles.processingRow}>
                        <Lock size={16} color="#fff" />

                        <MaskedView
                            maskElement={
                                <TextMalet style={styles.processingText}>
                                    Procesando...
                                </TextMalet>
                            }
                        >
                            <Animated.View
                                style={[
                                    styles.shimmerBand,
                                    { transform: [{ translateX }] },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#ffffff', '#c7c7cc', '#ffffff']}
                                    locations={[0, 0.5, 1]}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={styles.shimmerGradient}
                                />
                            </Animated.View>
                        </MaskedView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        // Espacio entre el logo y el texto de “Procesando...”.
        gap: 10,
    },
    logo: {
        // 132 → 92 → 74 → 67 (−30%, −20% y −10%).
        width: 67,
        height: 67,
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // El candado va justo al lado del texto, con un poco de aire.
        gap: 7,
        // Compensa el centrado: el texto queda 5 px más a la derecha que antes.
        marginLeft: 13,
    },
    processingText: {
        fontSize: 15.5,
        lineHeight: 21,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },
    shimmerBand: {
        width: SHIMMER_WIDTH,
        height: 21,
    },
    shimmerGradient: {
        flex: 1,
    },
});
