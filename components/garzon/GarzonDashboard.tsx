import TextMalet from '@/components/TextMalet/TextMalet';
import { DashboardData } from '@/shared/interfaces/garzon.interfaces';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, InteractionManager, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import GarzonLoadingSkeleton from './GarzonLoadingSkeleton';
import TopPagosCard from './TopPagosCard';
import TopProductosCard from './TopProductosCard';
import TopVentasCard from './TopVentasCard';

interface GarzonDashboardProps {
    data: DashboardData;
    fetchedAt: string | null;
    onRefresh: () => Promise<void>;
    isLoading: boolean;
}

type TabType = 'ventas' | 'pagos' | 'productos';

const TABS: { key: TabType; label: string }[] = [
    { key: 'ventas', label: 'Ventas' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'productos', label: 'Productos' },
];

const GarzonDashboard = memo(({ data, fetchedAt, onRefresh, isLoading }: GarzonDashboardProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('ventas');
    const [refreshing, setRefreshing] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true); // Start with skeleton
    const [isReady, setIsReady] = useState(false); // Wait for navigation to complete

    // Flag para evitar animaciones en el primer render
    const isFirstRender = useRef(true);

    // Animaciones
    const contentOpacity = useRef(new Animated.Value(0)).current; // Start hidden
    const skeletonOpacity = useRef(new Animated.Value(1)).current; // Start visible
    const lastUpdatedPulse = useRef(new Animated.Value(1)).current;
    const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
    const tabEntryAnim = useRef(new Animated.Value(0)).current; // For staggered tab entry

    // Animar transición entre skeleton y contenido
    const animateToLoading = useCallback(() => {
        console.log('[DEBUG] animateToLoading called');
        setShowSkeleton(true);
        Animated.parallel([
            Animated.timing(contentOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(skeletonOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            console.log('[DEBUG] animateToLoading COMPLETED');
        });
    }, [contentOpacity, skeletonOpacity]);

    const animateToContent = useCallback((onComplete?: () => void) => {
        console.log('[DEBUG] animateToContent called');
        Animated.sequence([
            Animated.timing(skeletonOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start((result) => {
            console.log('[DEBUG] animateToContent COMPLETED, finished:', result.finished);
            setShowSkeleton(false);
            // Ejecutar callback si existe (para setRefreshing)
            if (onComplete) {
                onComplete();
            }
        });

        // Pulse animation on "last updated"
        Animated.sequence([
            Animated.timing(lastUpdatedPulse, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(lastUpdatedPulse, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [skeletonOpacity, contentOpacity, lastUpdatedPulse]);

    // Manejar cambio de pestaña con animación
    const handleTabChange = useCallback((tab: TabType) => {
        const tabIndex = TABS.findIndex(t => t.key === tab);
        Animated.spring(tabIndicatorAnim, {
            toValue: tabIndex,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
        setActiveTab(tab);
    }, [tabIndicatorAnim]);

    const handleRefresh = useCallback(async () => {
        console.log('[DEBUG] handleRefresh START');
        setRefreshing(true);
        animateToLoading();
        console.log('[DEBUG] handleRefresh - calling onRefresh...');
        await onRefresh();
        console.log('[DEBUG] handleRefresh - onRefresh DONE, scheduling animateToContent');
        // Pequeño delay para asegurar que los datos se actualicen antes de animar
        setTimeout(() => {
            console.log('[DEBUG] handleRefresh - setTimeout fired, calling animateToContent');
            // Pasar setRefreshing(false) como callback para que se ejecute DESPUÉS de la animación
            animateToContent(() => {
                console.log('[DEBUG] handleRefresh - animation complete, setting refreshing=false');
                setRefreshing(false);
            });
        }, 100);
    }, [onRefresh, animateToLoading, animateToContent]);

    // Wait for navigation animation to complete before doing heavy work
    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            console.log('[DEBUG] InteractionManager - Navigation complete, setting isReady');
            setIsReady(true);
            // Animate tabs entry
            Animated.timing(tabEntryAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        });

        return () => interactionPromise.cancel();
    }, [tabEntryAnim]);

    // Observar cambios en isLoading (ignorar primer render)
    useEffect(() => {
        console.log('[DEBUG] useEffect triggered - isLoading:', isLoading, 'refreshing:', refreshing, 'isFirstRender:', isFirstRender.current, 'isReady:', isReady);

        // Wait until ready
        if (!isReady) {
            console.log('[DEBUG] useEffect - Not ready yet, skipping');
            return;
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;
            console.log('[DEBUG] useEffect - First render after ready, calling animateToContent');
            animateToContent();
            return;
        }

        // No interferir si ya estamos manejando refresh manualmente
        if (refreshing) {
            console.log('[DEBUG] useEffect - Skipping because refreshing=true');
            return;
        }

        if (isLoading) {
            console.log('[DEBUG] useEffect - isLoading=true, calling animateToLoading');
            animateToLoading();
        } else {
            console.log('[DEBUG] useEffect - isLoading=false, calling animateToContent');
            animateToContent();
        }
    }, [isLoading, refreshing, isReady, animateToLoading, animateToContent]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Memoized tab content to prevent unnecessary re-renders
    const tabContent = useMemo(() => {
        switch (activeTab) {
            case 'ventas':
                return <TopVentasCard data={data.ventasPorTienda} />;
            case 'pagos':
                return <TopPagosCard data={data.topPagos} />;
            case 'productos':
                return <TopProductosCard data={data.topProductos} />;
            default:
                return null;
        }
    }, [activeTab, data.ventasPorTienda, data.topPagos, data.topProductos]);

    const isLoadingState = refreshing || isLoading;

    return (
        <View style={styles.container}>
            {/* Tab Navigation with entry animation */}
            <Animated.View
                style={[
                    styles.tabContainer,
                    {
                        opacity: tabEntryAnim,
                        transform: [{
                            translateY: tabEntryAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-10, 0],
                            })
                        }]
                    }
                ]}
            >
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => handleTabChange(tab.key)}
                        disabled={isLoadingState || !isReady}
                    >
                        <TextMalet
                            style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive,
                                (isLoadingState || !isReady) && styles.tabTextDisabled
                            ]}
                        >
                            {tab.label}
                        </TextMalet>
                    </TouchableOpacity>
                ))}
            </Animated.View>

            {/* Last updated with animation */}
            <Animated.View
                style={[
                    styles.lastUpdatedContainer,
                    { transform: [{ scale: lastUpdatedPulse }] }
                ]}
            >
                <View style={[styles.statusDot, isLoadingState && styles.statusDotLoading]} />
                <TextMalet style={styles.lastUpdatedLabel}>
                    {isLoadingState ? 'Actualizando...' : 'Última actualización:'}
                </TextMalet>
                {!isLoadingState && (
                    <TextMalet style={styles.lastUpdatedValue}>{formatDate(fetchedAt)}</TextMalet>
                )}
            </Animated.View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isLoadingState}
                refreshControl={
                    <RefreshControl
                        refreshing={false} // Manejamos la UI de carga con nuestro skeleton
                        onRefresh={handleRefresh}
                        colors={['#F59E0B']}
                        tintColor="#F59E0B"
                        progressBackgroundColor="#FEF3C7"
                    />
                }
            >
                {/* Content Layer - Siempre montado */}
                <Animated.View style={{ opacity: contentOpacity }}>
                    {tabContent}

                    {/* Quick Stats - Minimalista */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                            <TextMalet style={styles.statValue}>{data.ventasPorTienda.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Tiendas</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                            <TextMalet style={styles.statValue}>{data.topPagos.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Pagos</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#6366F1' }]} />
                            <TextMalet style={styles.statValue}>{data.topProductos.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Productos</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#EC4899' }]} />
                            <TextMalet style={styles.statValue}>{data.ventasPorDepartamento.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Deptos</TextMalet>
                        </View>
                    </View>
                </Animated.View>

                {/* Skeleton Layer - Se superpone durante la carga */}
                {showSkeleton && (
                    <Animated.View
                        style={[styles.skeletonLayer, { opacity: skeletonOpacity }]}
                        pointerEvents={showSkeleton ? 'auto' : 'none'}
                    >
                        <GarzonLoadingSkeleton activeTab={activeTab} />
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#FEF3C7',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#D97706',
        fontWeight: '600',
    },
    tabTextDisabled: {
        opacity: 0.5,
    },
    lastUpdatedContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
        backgroundColor: '#FFFFFF',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusDotLoading: {
        backgroundColor: '#F59E0B',
    },
    lastUpdatedLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    lastUpdatedValue: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 0,
        paddingBottom: 0,
    },
    skeletonLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#F9FAFB',
        zIndex: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },
});

export default GarzonDashboard;
