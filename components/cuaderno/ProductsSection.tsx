import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Package, Plus } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import { StoreProduct } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { currencyOf, formatMoney } from './format';
import { ListRowsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';

/** Listado paginado de productos con acceso a crear/editar. */
export default function ProductsSection({ storeId }: { storeId: string }) {
    const products = useSalesModuleStore((s) => s.products);
    /** Scroll de la lista: minimiza la cabecera del panel. */
    const headerScroll = useStoreHeaderScroll();
    const productsLoading = useSalesModuleStore((s) => s.productsLoading);
    const loadProducts = useSalesModuleStore((s) => s.loadProducts);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const header = (
        <View style={styles.header}>
            <TextMalet style={styles.description}>
                Productos de la tienda. El costo y el PVP se usan como valores por defecto al
                registrar una venta.
            </TextMalet>
            <Button
                text="Nuevo producto"
                icon={<Plus size={14} color="#fff" />}
                style={styles.newBtn}
                onPress={() =>
                    router.push({ pathname: '/cuaderno/product-form', params: { store: storeId } } as any)
                }
            />
            <SectionTitle icon={Package}>Productos</SectionTitle>
        </View>
    );

    const renderProduct = ({ item }: { item: StoreProduct }) => (
        <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() =>
                router.push({
                    pathname: '/cuaderno/product-form',
                    params: { store: storeId, id: item.id },
                } as any)
            }
        >
            <View style={{ flex: 1 }}>
                <TextMalet style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                </TextMalet>
                <TextMalet style={styles.rowSub}>
                    Costo {formatMoney(Number(item.cost ?? 0), currency)} → PVP{' '}
                    {formatMoney(Number(item.pvp ?? 0), currency)}
                </TextMalet>
            </View>
            <TextMalet style={styles.chevron}>›</TextMalet>
        </TouchableOpacity>
    );

    return (
        <FlashList
            {...headerScroll}
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            ListHeaderComponent={header}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => loadProducts({ refresh: false })}
            onRefresh={() => loadProducts({ refresh: true })}
            refreshing={productsLoading && products.length === 0}
            ListEmptyComponent={
                productsLoading ? (
                    <ListRowsSkeleton rows={5} />
                ) : (
                    <View style={styles.empty}>
                        <TextMalet style={styles.emptyTitle}>Aún no hay productos</TextMalet>
                        <TextMalet style={styles.emptyText}>
                            Crea tu primer producto para poder registrar ventas.
                        </TextMalet>
                    </View>
                )
            }
        />
    );
}

const styles = StyleSheet.create({
    header: {
        gap: 14,
        paddingBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    newBtn: {
        alignSelf: 'flex-start',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    listContent: {
        paddingBottom: 48,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 8,
        gap: 10,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 3,
    },
    rowSub: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
    },
    chevron: {
        fontSize: 20,
        color: 'rgba(0,0,0,0.25)',
        fontWeight: '600',
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
