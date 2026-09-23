import Switch from '@/components/Switch/Switch';
import TextMalet from '@/components/TextMalet/TextMalet';
import { DashboardData } from '@/shared/interfaces/garzon.interfaces';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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

const TAB_OPTIONS = [
    { value: 'ventas' as TabType, label: 'Ventas' },
    { value: 'pagos' as TabType, label: 'Pagos' },
    { value: 'productos' as TabType, label: 'Productos' },
];

const GarzonDashboard = memo(({ data, fetchedAt, onRefresh, isLoading }: GarzonDashboardProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('ventas');
    const [refreshing, setRefreshing] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);

    const contentOpacity = useRef(new Animated.Value(0)).current;
    const skeletonOpacity = useRef(new Animated.Value(1)).current;
    const lastUpdatedPulse = useRef(new Animated.Value(1)).current;

    const animateToLoading = useCallback(() => {
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
        ]).start();
    }, [contentOpacity, skeletonOpacity]);

    const animateToContent = useCallback((onComplete?: () => void) => {
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
            setShowSkeleton(false);
            if (onComplete) {
                onComplete();
            }
        });

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

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        animateToLoading();
        await onRefresh();
        setTimeout(() => {
            animateToContent(() => {
                setRefreshing(false);
            });
        }, 100);
    }, [onRefresh, animateToLoading, animateToContent]);

    // Control skeleton/content transitions
    useEffect(() => {
        if (refreshing) return;

        if (isLoading) {
            animateToLoading();
        } else {
            animateToContent();
        }
    }, [isLoading, refreshing, animateToLoading, animateToContent]);

    // Initial load - show content once
    useEffect(() => {
        if (!isLoading) {
            animateToContent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            {/* Tab Navigation with Switch */}
            <View style={styles.tabWrapper}>
                <Switch
                    options={TAB_OPTIONS}
                    selected={activeTab}
                    onSelect={setActiveTab}
                    height={40}
                    fontWeight="500"
                />
            </View>

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
                        refreshing={false}
                        onRefresh={handleRefresh}
                        colors={['#0c0c0c', '#6b6bdb']}
                        tintColor="#b4b4b4"
                        progressBackgroundColor="#d4d4d4"
                    />
                }
            >
                {/* Content Layer - Siempre montado */}
                <Animated.View style={{ opacity: contentOpacity }}>
                    {tabContent}

                    {/* Quick Stats - Minimalista */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#444444' }]} />
                            <TextMalet style={styles.statValue}>{data.ventasPorTienda.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Tiendas</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#686868' }]} />
                            <TextMalet style={styles.statValue}>{data.topPagos.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Pagos</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#bebebe' }]} />
                            <TextMalet style={styles.statValue}>{data.topProductos.length}</TextMalet>
                            <TextMalet style={styles.statLabel}>Productos</TextMalet>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: '#b7a3f0' }]} />
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
    tabWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
