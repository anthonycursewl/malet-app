import { FlashList } from '@shopify/flash-list';
import { Plus, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import { Sale } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import SaleRow from './SaleRow';
import SalesFiltersBar from './SalesFiltersBar';
import SeriesChartCard from './SeriesChartCard';
import SummaryCards from './SummaryCards';
import { currencyOf } from './format';
import { ListRowsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';

/** Ventas que se listan en el panel; el resto vive en la pantalla “Ver todas”. */
const DASHBOARD_SALES_LIMIT = 10;

/**
 * Sección "Ventas": resumen + gráfica + filtros + listado paginado.
 * Va dentro del panel de tienda (app/cuaderno/store.tsx).
 */
export default function SalesSection({ storeId }: { storeId: string }) {
    const sales = useSalesModuleStore((s) => s.sales);
    /** Scroll de la lista: minimiza la cabecera del panel. */
    const headerScroll = useStoreHeaderScroll();
    const salesLoading = useSalesModuleStore((s) => s.salesLoading);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const loadSales = useSalesModuleStore((s) => s.loadSales);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    /** El panel muestra solo las últimas 10: el resto, en “Ver todas”. */
    const visibleSales = sales.slice(0, DASHBOARD_SALES_LIMIT);

    const header = (
        <View style={styles.header}>
            <Button
                text="Nueva venta"
                icon={<Plus size={14} color="#fff" />}
                style={styles.newSaleBtn}
                onPress={() =>
                    router.push({ pathname: '/cuaderno/sale', params: { store: storeId } } as any)
                }
            />
            <SalesFiltersBar />
            <SummaryCards />
            <SeriesChartCard />
            <SectionTitle icon={ShoppingCart}>Ventas</SectionTitle>
        </View>
    );

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
                        params: { store: storeId, id: item.id },
                    } as any)
                }
            />
        ),
        [currency, paymentMethods, storeId]
    );

    const keyExtractor = useCallback((item: Sale) => item.id, []);

    return (
        <FlashList
            {...headerScroll}
            data={visibleSales}
            keyExtractor={keyExtractor}
            renderItem={renderSale}
            ListHeaderComponent={header}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={() => loadSales({ refresh: true })}
            refreshing={salesLoading && sales.length === 0}
            // Ventana de renderizado ajustada (como en la lista de transacciones).
            drawDistance={400}
            ListEmptyComponent={
                salesLoading ? (
                    <ListRowsSkeleton rows={4} />
                ) : (
                    <View style={styles.empty}>
                        <TextMalet style={styles.emptyTitle}>Aún no hay ventas</TextMalet>
                        <TextMalet style={styles.emptyText}>
                            Registra tu primera venta con el botón “Nueva venta”.
                        </TextMalet>
                    </View>
                )
            }
            ListFooterComponent={
                visibleSales.length > 0 ? (
                    <Button
                        text="Ver todas las ventas"
                        onPress={() =>
                            router.push({
                                pathname: '/cuaderno/sales',
                                params: { store: storeId },
                            } as any)
                        }
                        style={styles.allSalesBtn}
                    />
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    header: {
        gap: 16,
        paddingBottom: 4,
    },
    newSaleBtn: {
        alignSelf: 'flex-start',
    },
    listContent: {
        paddingBottom: 48,
    },
    allSalesBtn: {
        alignSelf: 'center',
        marginTop: 6,
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
    footerSpinner: {
        marginVertical: 16,
    },
});
