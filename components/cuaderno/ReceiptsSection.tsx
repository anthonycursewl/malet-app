import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { Receipt } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { currencyOf, formatMoney, formatSaleDate } from './format';
import { ListRowsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';
import DeletingOverlay from './DeletingOverlay';
import { useDeleteReceipt } from './useDeleteReceipt';

interface ReceiptRowProps {
    receipt: Receipt;
    productLabel: string;
    currency: ReturnType<typeof currencyOf>;
    onPress: () => void;
    /** Solo el dueño de la tienda: mantén pulsado para eliminar. */
    onLongPress?: () => void;
}

/** Fila de la tabla de recibos con el enlace a su venta. */
function ReceiptRow({ receipt, productLabel, currency, onPress, onLongPress }: ReceiptRowProps) {
    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.rowIcon}>
                <ReceiptText size={16} color="#111" />
            </View>
            <View style={{ flex: 1 }}>
                <TextMalet style={styles.rowNumber} numberOfLines={1}>
                    {receipt.number}
                </TextMalet>
                <TextMalet style={styles.rowSub} numberOfLines={1}>
                    {productLabel} · {formatSaleDate(receipt.issued_at)}
                    {receipt.customer_name ? ` · ${receipt.customer_name}` : ''}
                </TextMalet>
            </View>
            <TextMalet style={styles.rowTotal}>
                {formatMoney(receipt.total, currency)}
            </TextMalet>
        </TouchableOpacity>
    );
}

/**
 * Sección "Recibos": tabla de los recibos emitidos en la tienda.
 * Cada recibo está relacionado con su venta (botón en el documento).
 * El dueño de la tienda puede eliminar uno manteniéndolo pulsado.
 */
export default function ReceiptsSection({ storeId }: { storeId: string }) {
    const receipts = useSalesModuleStore((s) => s.receipts);
    /** Scroll de la lista: minimiza la cabecera del panel. */
    const headerScroll = useStoreHeaderScroll();
    const receiptsLoading = useSalesModuleStore((s) => s.receiptsLoading);
    const loadReceipts = useSalesModuleStore((s) => s.loadReceipts);
    const sales = useSalesModuleStore((s) => s.sales);
    const products = useSalesModuleStore((s) => s.products);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));
    const { isOwner, deleting, confirmDelete } = useDeleteReceipt();

    const productLabelOf = (receipt: Receipt): string => {
        const line = receipt.lines?.[0];
        if (line?.product_name) return line.product_name;
        const sale = sales.find((s) => s.id === receipt.sale_id);
        if (!sale) return 'Venta';
        const firstItem = sale.items?.[0];
        return (
            firstItem?.name ??
            firstItem?.product_name ??
            products.find((p) => p.id === firstItem?.product_id)?.name ??
            'Venta'
        );
    };

    const header = (
        <View style={styles.header}>
            <TextMalet style={styles.description}>
                Recibos emitidos con folio de Breadriuss. Cada uno queda ligado a su venta.
            </TextMalet>
            {isOwner && (
                <TextMalet style={styles.hint}>
                    Mantén pulsado un recibo para eliminarlo (solo el dueño puede hacerlo).
                </TextMalet>
            )}
            <SectionTitle icon={ReceiptText}>Recibos</SectionTitle>
        </View>
    );

    return (
        <View style={styles.wrap}>
            <FlashList
                {...headerScroll}
                data={receipts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ReceiptRow
                    receipt={item}
                    productLabel={productLabelOf(item)}
                    currency={currency}
                    onPress={() =>
                        router.push({
                            pathname: '/cuaderno/receipt',
                            params: { store: storeId, id: item.id },
                        } as any)
                    }
                    onLongPress={isOwner ? () => confirmDelete(item) : undefined}
                />
            )}
            ListHeaderComponent={header}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => loadReceipts({ refresh: false })}
            onRefresh={() => loadReceipts({ refresh: true })}
            refreshing={receiptsLoading && receipts.length === 0}
            ListEmptyComponent={
                receiptsLoading ? (
                    <ListRowsSkeleton rows={4} />
                ) : (
                    <View style={styles.empty}>
                        <TextMalet style={styles.emptyTitle}>Aún no hay recibos</TextMalet>
                        <TextMalet style={styles.emptyText}>
                            Activa “Generar recibo” al registrar una venta para emitir su folio.
                        </TextMalet>
                    </View>
                )
            }
        />

            <DeletingOverlay visible={deleting} label="Eliminando recibo…" />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    header: {
        gap: 14,
        paddingBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    hint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
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
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        gap: 10,
    },
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowNumber: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
        marginBottom: 3,
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
    },
    rowTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
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
