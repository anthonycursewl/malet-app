import TextMalet from '@/components/TextMalet/TextMalet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// Componente base del shimmer con animación
const ShimmerEffect = memo(({ width, height, borderRadius = 6, style }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View style={[{ width: width as any, height, borderRadius, overflow: 'hidden', backgroundColor: '#E5E7EB' }, style]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

// Skeleton para una tienda individual
const TiendaSkeleton = memo(({ delay = 0 }: { delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [fadeAnim, delay]);

    return (
        <Animated.View style={[styles.tiendaSkeleton, { opacity: fadeAnim }]}>
            <View style={styles.tiendaHeader}>
                <View style={styles.tiendaLeft}>
                    <ShimmerEffect width={28} height={28} borderRadius={8} />
                    <View style={styles.tiendaTextGroup}>
                        <ShimmerEffect width={120} height={14} />
                        <ShimmerEffect width={60} height={10} style={{ marginTop: 4 }} />
                    </View>
                </View>
                <ShimmerEffect width={50} height={12} />
            </View>
            <View style={styles.progressRow}>
                <ShimmerEffect width="70%" height={8} borderRadius={4} />
                <ShimmerEffect width={80} height={12} />
            </View>
        </Animated.View>
    );
});

// Skeleton para métodos de pago
const PaymentSkeleton = memo(({ delay = 0 }: { delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [fadeAnim, delay]);

    return (
        <Animated.View style={[styles.paymentSkeleton, { opacity: fadeAnim }]}>
            <View style={styles.paymentHeader}>
                <View style={styles.paymentLeft}>
                    <ShimmerEffect width={8} height={8} borderRadius={4} />
                    <ShimmerEffect width={100} height={12} />
                </View>
                <ShimmerEffect width={40} height={18} borderRadius={4} />
            </View>
            <View style={styles.progressRow}>
                <ShimmerEffect width="60%" height={6} borderRadius={3} />
                <ShimmerEffect width={70} height={12} />
            </View>
        </Animated.View>
    );
});

// Skeleton para productos
const ProductoSkeleton = memo(({ delay = 0 }: { delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [fadeAnim, delay]);

    return (
        <Animated.View style={[styles.productoSkeleton, { opacity: fadeAnim }]}>
            <View style={styles.productoLeft}>
                <ShimmerEffect width={24} height={24} borderRadius={6} />
                <View>
                    <ShimmerEffect width={140} height={13} />
                    <ShimmerEffect width={80} height={10} style={{ marginTop: 4 }} />
                </View>
            </View>
            <View style={styles.productoRight}>
                <ShimmerEffect width={50} height={14} />
                <ShimmerEffect width={70} height={11} style={{ marginTop: 2 }} />
            </View>
        </Animated.View>
    );
});

// Header animado con mensaje de carga
const LoadingHeader = memo(() => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Sequential dot animation
        const animateDots = () => {
            Animated.sequence([
                Animated.timing(dotAnim1, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(dotAnim2, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(dotAnim3, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.delay(400),
                Animated.parallel([
                    Animated.timing(dotAnim1, { toValue: 0, duration: 200, useNativeDriver: true }),
                    Animated.timing(dotAnim2, { toValue: 0, duration: 200, useNativeDriver: true }),
                    Animated.timing(dotAnim3, { toValue: 0, duration: 200, useNativeDriver: true }),
                ]),
                Animated.delay(200),
            ]).start(() => animateDots());
        };
        animateDots();
    }, [pulseAnim, dotAnim1, dotAnim2, dotAnim3]);

    return (
        <View style={styles.loadingHeaderContainer}>
            <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loadingHeaderGradient}
            >
                <Animated.View style={{ opacity: pulseAnim, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.syncIcon}>
                        <Animated.View style={[styles.syncRing, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.syncDot} />
                    </View>
                    <View>
                        <View style={styles.loadingTextRow}>
                            <TextMalet style={styles.loadingTitle}>Sincronizando datos</TextMalet>
                            <View style={styles.dotsContainer}>
                                <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
                                <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
                                <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
                            </View>
                        </View>
                        <TextMalet style={styles.loadingSubtitle}>Obteniendo información del servidor</TextMalet>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
});

// Componente principal del skeleton
const GarzonLoadingSkeleton = memo(({ activeTab }: { activeTab: 'ventas' | 'pagos' | 'productos' }) => {
    const renderVentasSkeleton = () => (
        <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View>
                    <ShimmerEffect width={140} height={18} />
                    <ShimmerEffect width={80} height={12} style={{ marginTop: 6 }} />
                </View>
                <ShimmerEffect width={70} height={28} borderRadius={6} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRowSkeleton}>
                <View style={styles.statItemSkeleton}>
                    <ShimmerEffect width={40} height={12} />
                    <ShimmerEffect width={100} height={16} style={{ marginTop: 6 }} />
                </View>
                <View style={styles.statDividerSkeleton} />
                <View style={styles.statItemSkeleton}>
                    <ShimmerEffect width={40} height={12} />
                    <ShimmerEffect width={80} height={16} style={{ marginTop: 6 }} />
                </View>
            </View>

            {/* Tiendas list */}
            <View style={styles.listSkeleton}>
                {[0, 1, 2, 3, 4].map((_, index) => (
                    <TiendaSkeleton key={index} delay={index * 100} />
                ))}
            </View>
        </View>
    );

    const renderPagosSkeleton = () => (
        <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View>
                    <ShimmerEffect width={150} height={18} />
                    <ShimmerEffect width={100} height={12} style={{ marginTop: 6 }} />
                </View>
            </View>

            {/* Distribution bar */}
            <View style={styles.distributionBarSkeleton}>
                <ShimmerEffect width="30%" height={6} borderRadius={3} style={{ backgroundColor: '#D1D5DB' }} />
                <ShimmerEffect width="25%" height={6} borderRadius={3} style={{ backgroundColor: '#E5E7EB' }} />
                <ShimmerEffect width="20%" height={6} borderRadius={3} style={{ backgroundColor: '#D1D5DB' }} />
                <ShimmerEffect width="15%" height={6} borderRadius={3} style={{ backgroundColor: '#E5E7EB' }} />
            </View>

            {/* Payment methods */}
            <View style={styles.listSkeleton}>
                {[0, 1, 2, 3, 4, 5].map((_, index) => (
                    <PaymentSkeleton key={index} delay={index * 80} />
                ))}
            </View>

            {/* Total */}
            <View style={styles.totalRowSkeleton}>
                <ShimmerEffect width={100} height={13} />
                <ShimmerEffect width={120} height={18} />
            </View>
        </View>
    );

    const renderProductosSkeleton = () => (
        <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View>
                    <ShimmerEffect width={130} height={18} />
                    <ShimmerEffect width={90} height={12} style={{ marginTop: 6 }} />
                </View>
                <ShimmerEffect width={70} height={28} borderRadius={6} />
            </View>

            {/* Products list */}
            <View style={styles.listSkeleton}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                    <ProductoSkeleton key={index} delay={index * 60} />
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LoadingHeader />
            <View style={styles.content}>
                {activeTab === 'ventas' && renderVentasSkeleton()}
                {activeTab === 'pagos' && renderPagosSkeleton()}
                {activeTab === 'productos' && renderProductosSkeleton()}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    loadingHeaderContainer: {
        marginBottom: 0,
    },
    loadingHeaderGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncIcon: {
        width: 40,
        height: 40,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncRing: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#D97706',
        opacity: 0.5,
    },
    syncDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D97706',
    },
    loadingTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
    },
    loadingSubtitle: {
        fontSize: 12,
        color: '#B45309',
        marginTop: 2,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginLeft: 4,
        gap: 3,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#92400E',
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomColor: '#E5E7EB',
        borderBottomWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statsRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    statItemSkeleton: {
        flex: 1,
        alignItems: 'center',
    },
    statDividerSkeleton: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    listSkeleton: {
        gap: 16,
    },
    tiendaSkeleton: {
        gap: 8,
    },
    tiendaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tiendaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tiendaTextGroup: {
        gap: 0,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    paymentSkeleton: {
        gap: 6,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    distributionBarSkeleton: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
        gap: 2,
    },
    totalRowSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    productoSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    productoRight: {
        alignItems: 'flex-end',
    },
});

export default GarzonLoadingSkeleton;
