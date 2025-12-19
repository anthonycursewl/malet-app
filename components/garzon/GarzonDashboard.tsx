import TextMalet from '@/components/TextMalet/TextMalet';
import { DashboardData } from '@/shared/interfaces/garzon.interfaces';
import React, { memo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

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

    const renderContent = () => {
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
    };

    return (
        <View style={styles.container}>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <TextMalet
                            style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
                        >
                            {tab.label}
                        </TextMalet>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Last updated */}
            <View style={styles.lastUpdatedContainer}>
                <TextMalet style={styles.lastUpdatedLabel}>Última actualización:</TextMalet>
                <TextMalet style={styles.lastUpdatedValue}>{formatDate(fetchedAt)}</TextMalet>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing || isLoading}
                        onRefresh={handleRefresh}
                        colors={['#F59E0B']}
                        tintColor="#F59E0B"
                    />
                }
            >
                {renderContent()}

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
    lastUpdatedContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
        backgroundColor: '#FFFFFF',
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
