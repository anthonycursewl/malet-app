import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import SaleRow from '@/components/cuaderno/SaleRow';
import SalesFiltersBar from '@/components/cuaderno/SalesFiltersBar';
import { ListRowsSkeleton } from '@/components/cuaderno/Skeletons';
import { currencyOf, formatMoney } from '@/components/cuaderno/format';
import { Sale } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/**
 * Todas las ventas de la tienda: filtros inteligentes (rango, producto y
 * método de cobro) y listado **paginado por cursor** que solo pide la
 * siguiente página al llegar al final.
 */
export default function AllSalesScreen() {
    const { store: storeId } = useLocalSearchParams<{ store: string }>();
    const sales = useSalesModuleStore((s) => s.sales);
    const salesLoading = useSalesModuleStore((s) => s.salesLoading);
    const salesPagination = useSalesModuleStore((s) => s.salesPagination);
    const summary = useSalesModuleStore((s) => s.summary);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const loadSales = useSalesModuleStore((s) => s.loadSales);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    // Si el panel ya dejó ventas en el store, la pantalla se pinta al instante
    // (stale-while-revalidate) y solo se pide la primera página si no hay nada.
    const requestedInitialPage = useRef(false);
    useEffect(() => {
        if (requestedInitialPage.current) return;
        requestedInitialPage.current = true;

        if (useSalesModuleStore.getState().sales.length === 0) {
            void loadSales({ refresh: true });
        }
    }, [loadSales]);

    const renderSale = useCallback(
        ({ item }: { item: Sale }) => (
            <SaleRow
                sale={item}
                paymentMethodName={
                    item.payment_method_id
                        ? paymentMethods.find((m) => m.id === item.payment_method_id)?.name
                        : undefined
                }
                currency={currency}
                onPress={() =>
                    router.push({
                        pathname: '/cuaderno/sale-detail',
                        params: { store: storeId ?? '', id: item.id },
                    } as any)
                }
            />
        ),
        [currency, paymentMethods, storeId]
    );

    const keyExtractor = useCallback((item: Sale) => item.id, []);

    const header = useCallback(
        () => (
            <View style={styles.header}>
                <SalesFiltersBar />

                {summary && summary.sales_count > 0 && (
                    <View style={styles.summaryRow}>
                        <TextMalet style={styles.summaryText}>
                            {summary.sales_count}{' '}
                            {summary.sales_count === 1 ? 'venta' : 'ventas'} ·{' '}
                            {summary.units_sold} uds
                        </TextMalet>
                        <TextMalet style={styles.summaryTotal}>
                            {formatMoney(summary.revenue, currency)}
                        </TextMalet>
                    </View>
                )}
            </View>
        ),
        [summary, currency]
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader
                    title="Todas las ventas"
                    subtitle={`${sales.length}${
                        salesPagination.isEnd ? '' : '+'
                    } cargadas · paginado por cursor`}
                />

                <FlashList
                    data={sales}
                    keyExtractor={keyExtractor}
                    renderItem={renderSale}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadSales({ refresh: false })}
                    onRefresh={() => loadSales({ refresh: true })}
                    refreshing={salesLoading && sales.length === 0}
                    // Ventana de renderizado ajustada (como en la lista de transacciones).
                    drawDistance={400}
                    ListEmptyComponent={
                        salesLoading ? (
                            <ListRowsSkeleton rows={5} />
                        ) : (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>
                                    Sin ventas en este rango
                                </TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    Cambia el rango o los filtros para ver otras ventas.
                                </TextMalet>
                            </View>
                        )
                    }
                />
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    header: {
        gap: 14,
        paddingBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    summaryText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.55)',
    },
    summaryTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    listContent: {
        paddingBottom: 48,
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        gap: 6,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
    },
});
