import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Animated, Easing, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import { SaleDetailSkeleton } from '@/components/cuaderno/Skeletons';
import { currencyOf, formatMoney, formatSaleDate } from '@/components/cuaderno/format';
import {
    Receipt,
    Sale,
    SaleItem,
    itemTotal,
    saleProfit,
    saleTotal,
    saleUnits,
    StoreCurrency,
} from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/** Separador punteado del ticket. */
function Dashed() {
    return <View style={styles.dashed} />;
}

/** Fila de datos del ticket (etiqueta + valor). */
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <TextMalet style={styles.infoLabel}>{label}</TextMalet>
            <TextMalet style={styles.infoValue} numberOfLines={2}>
                {value}
            </TextMalet>
        </View>
    );
}

/**
 * Detalle de una venta con aspecto de **ticket de supermercado** (solo lectura).
 * La edición se activa con el botón "Editar venta".
 */
export default function SaleDetailScreen() {
    const { store: storeId, id: saleId } = useLocalSearchParams<{ store: string; id?: string }>();
    const fetchSale = useSalesModuleStore((s) => s.fetchSale);
    const fetchSaleReceipt = useSalesModuleStore((s) => s.fetchSaleReceipt);
    const products = useSalesModuleStore((s) => s.products);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const customers = useSalesModuleStore((s) => s.customers);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const [sale, setSale] = useState<Sale | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    /** Entrada suave del contenido para evitar saltos al terminar la carga. */
    const [contentAnim] = useState(() => new Animated.Value(0));

    // Se recarga al volver del formulario para reflejar los cambios.
    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            (async () => {
                if (!saleId) {
                    setErrorMsg('Venta no encontrada.');
                    setLoading(false);
                    return;
                }
                // Venta y recibo en paralelo: el ticket se dibuja una sola vez,
                // ya con su folio y su botón definitivos.
                const [saleRes, receiptRes] = await Promise.all([
                    fetchSale(saleId),
                    fetchSaleReceipt(saleId),
                ]);
                if (!mounted) return;
                if (saleRes.error || !saleRes.sale) {
                    setErrorMsg(saleRes.error ?? 'Venta no encontrada.');
                    setLoading(false);
                    return;
                }
                setSale(saleRes.sale);
                setReceipt(receiptRes.receipt ?? null);
                setErrorMsg(null);
                setLoading(false);
            })();
            return () => {
                mounted = false;
            };
        }, [saleId, fetchSale, fetchSaleReceipt])
    );

    // Fade + leve subida al aparecer el contenido.
    useEffect(() => {
        if (loading) return;
        contentAnim.setValue(0);
        Animated.timing(contentAnim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [loading, contentAnim]);

    const contentStyle = {
        flex: 1,
        opacity: contentAnim,
        transform: [
            {
                translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                }),
            },
        ],
    } as const;

    const items = sale?.items ?? [];
    const itemName = (item: SaleItem): string =>
        item.name ??
        item.product_name ??
        products.find((p) => p.id === item.product_id)?.name ??
        'Producto';
    const paymentMethodName = sale?.payment_method_id
        ? paymentMethods.find((m) => m.id === sale.payment_method_id)?.name ?? 'Sin método'
        : 'Sin método';
    const customerName = sale?.customer_id
        ? customers.find((c) => c.id === sale.customer_id)?.name ?? 'Cliente'
        : null;
    const profit = sale ? saleProfit(sale) : 0;
    const hasReference = sale?.reference_currency != null && sale?.reference_amount != null;
    const folio = receipt?.number ?? (sale ? sale.id.slice(0, 8).toUpperCase() : '');
    /**
     * Contenido del QR: prefijo propio (`malet:sale:`) + id de la venta y, si ya
     * se emitió, el folio del recibo. Queda listo para un futuro lector.
     */
    const qrPayload = sale
        ? receipt
            ? `malet:sale:${sale.id}:${receipt.number}${
                  receipt.verify_token ? `:${receipt.verify_token}` : ''
              }`
            : `malet:sale:${sale.id}`
        : '';

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader
                    title="Detalle de venta"
                    subtitle={items[0] ? itemName(items[0]) : undefined}
                />

                {loading && !sale ? (
                    <SaleDetailSkeleton />
                ) : !sale ? (
                    <View style={styles.errorBox}>
                        <TextMalet style={styles.errorTitle}>Venta no disponible</TextMalet>
                        <TextMalet style={styles.errorText}>
                            {errorMsg ?? 'Esta venta ya no existe.'}
                        </TextMalet>
                        <Button
                            text="Volver"
                            onPress={() => {
                                if (router.canGoBack()) router.back();
                            }}
                        />
                    </View>
                ) : (
                    <Animated.View style={contentStyle}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                        {/* Papel del ticket */}
                        <View style={styles.ticket}>
                            {/* Cabecera centrada */}
                            <View style={styles.ticketHeader}>
                                <TextMalet style={styles.storeName} numberOfLines={2}>
                                    {(
                                        receipt?.store_name?.trim() ||
                                        currentStore?.name ||
                                        'Malet Sales'
                                    ).toUpperCase()}
                                </TextMalet>
                                <TextMalet style={styles.ticketKind}>COMPROBANTE DE VENTA</TextMalet>
                                <TextMalet style={styles.ticketMeta}>
                                    {formatSaleDate(sale.sold_at)}
                                </TextMalet>
                                <TextMalet style={styles.ticketFolio}>Nº {folio}</TextMalet>
                            </View>

                            <Dashed />

                            {/* Encabezado de la tabla */}
                            <View style={styles.tableHead}>
                                <TextMalet style={[styles.tableHeadText, styles.colQty]}>Cant</TextMalet>
                                <TextMalet style={[styles.tableHeadText, styles.colDesc]}>
                                    Descripción
                                </TextMalet>
                                <TextMalet style={[styles.tableHeadText, styles.colAmount]}>
                                    Importe
                                </TextMalet>
                            </View>

                            {/* Líneas */}
                            {items.map((item, index) => (
                                <View key={item.id ?? `${item.product_id}-${index}`} style={styles.line}>
                                    <View style={styles.lineMain}>
                                        <TextMalet style={[styles.lineQty, styles.colQty]}>
                                            {item.quantity}
                                        </TextMalet>
                                        <TextMalet style={[styles.lineName, styles.colDesc]}>
                                            {itemName(item)}
                                        </TextMalet>
                                        <TextMalet style={[styles.lineAmount, styles.colAmount]}>
                                            {formatMoney(itemTotal(item), currency)}
                                        </TextMalet>
                                    </View>
                                    <TextMalet style={styles.lineUnit}>
                                        {item.quantity} × {formatMoney(Number(item.unit_price), currency)}
                                    </TextMalet>
                                </View>
                            ))}

                            <Dashed />

                            {/* Contadores */}
                            <View style={styles.counters}>
                                <TextMalet style={styles.counterText}>
                                    ARTÍCULOS {items.length}
                                </TextMalet>
                                <TextMalet style={styles.counterText}>
                                    UNIDADES {saleUnits(sale)}
                                </TextMalet>
                            </View>

                            {/* Totales alineados a la derecha, como en una factura */}
                            <View style={styles.totalsBlock}>
                                <View style={styles.totalRow}>
                                    <TextMalet style={styles.totalRowLabel}>Subtotal</TextMalet>
                                    <TextMalet style={styles.totalRowValue}>
                                        {formatMoney(saleTotal(sale), currency)}
                                    </TextMalet>
                                </View>
                                <View style={styles.totalRule} />
                                <View style={styles.totalRow}>
                                    <TextMalet style={styles.grandLabel}>Total</TextMalet>
                                    <TextMalet style={styles.grandValue}>
                                        {formatMoney(saleTotal(sale), currency)}
                                    </TextMalet>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextMalet style={styles.totalRowLabel}>Ganancia</TextMalet>
                                    <TextMalet
                                        style={[
                                            styles.totalRowValue,
                                            { color: profit >= 0 ? '#16a34a' : '#dc2626' },
                                        ]}
                                    >
                                        {profit >= 0 ? '+' : ''}
                                        {formatMoney(profit, currency)}
                                    </TextMalet>
                                </View>
                            </View>

                            <Dashed />

                            {/* Datos */}
                            {customerName && <InfoRow label="Cliente" value={customerName} />}
                            <InfoRow label="Método de cobro" value={paymentMethodName} />
                            {hasReference && (
                                <InfoRow
                                    label={`Referencia (${sale.reference_currency})`}
                                    value={`≈ ${formatMoney(
                                        Number(sale.reference_amount),
                                        sale.reference_currency as StoreCurrency
                                    )}`}
                                />
                            )}

                            <Dashed />

                            {/* Pie */}
                            <View style={styles.qrWrap}>
                                <QRCode
                                    value={qrPayload}
                                    size={126}
                                    backgroundColor="white"
                                    color="#000"
                                />
                            </View>
                            <TextMalet style={styles.qrCaption}>{folio}</TextMalet>
                            <TextMalet style={styles.thanks}>*** GRACIAS POR SU COMPRA ***</TextMalet>
                        </View>

                        <TextMalet style={styles.hint}>
                            Vista de solo lectura. Toca “Editar venta” para modificar los datos o
                            eliminarla.
                        </TextMalet>
                        </ScrollView>

                        {/* Acciones fijas abajo */}
                        <View style={styles.footer}>
                            <Button
                                text="Editar venta"
                                onPress={() =>
                                    router.push({
                                        pathname: '/cuaderno/sale',
                                        params: { store: storeId, id: sale.id },
                                    } as any)
                                }
                                style={styles.actionBtn}
                            />

                            {receipt && (
                                <Button
                                    text={`Ver recibo ${receipt.number}`}
                                    icon={<ReceiptText size={15} color="#fff" />}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/cuaderno/receipt',
                                            params: { store: storeId, id: receipt.id },
                                        } as any)
                                    }
                                    style={styles.actionBtn}
                                />
                            )}
                        </View>
                    </Animated.View>
                )}
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
    scrollContent: {
        paddingBottom: 48,
        gap: 14,
    },
    ticket: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 18,
        gap: 8,
    },
    ticketHeader: {
        alignItems: 'center',
        gap: 2,
    },
    storeName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        letterSpacing: 1.2,
        textAlign: 'center',
    },
    ticketKind: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        letterSpacing: 2,
    },
    ticketMeta: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.55)',
        marginTop: 6,
    },
    ticketFolio: {
        fontSize: 11,
        fontWeight: '700',
        color: '#111',
        letterSpacing: 0.5,
    },
    dashed: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.18)',
        borderStyle: 'dashed',
        marginVertical: 8,
    },
    tableHead: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tableHeadText: {
        fontSize: 9.5,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    colQty: {
        width: 34,
        textAlign: 'center',
    },
    colDesc: {
        flex: 1,
    },
    colAmount: {
        width: 96,
        textAlign: 'right',
    },
    line: {
        marginTop: 6,
    },
    lineMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lineQty: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
    lineName: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
    lineAmount: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    lineUnit: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.45)',
        marginLeft: 34,
        marginTop: 1,
    },
    counters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    counterText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.5)',
        letterSpacing: 0.6,
    },
    totalsBlock: {
        alignSelf: 'flex-end',
        width: '70%',
        gap: 4,
        marginTop: 4,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    totalRowLabel: {
        fontSize: 11.5,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    totalRowValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
    totalRule: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        marginVertical: 3,
    },
    grandLabel: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#111',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    grandValue: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 3,
    },
    infoLabel: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
        textAlign: 'right',
        flexShrink: 1,
    },
    qrWrap: {
        alignItems: 'center',
        marginTop: 8,
    },
    qrCaption: {
        fontSize: 11,
        letterSpacing: 2,
        color: 'rgba(0,0,0,0.6)',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600',
    },
    thanks: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'center',
        marginTop: 10,
    },
    hint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.4)',
        textAlign: 'center',
        lineHeight: 17,
        paddingHorizontal: 8,
    },
    actionBtn: {
        width: '100%',
    },
    footer: {
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        backgroundColor: 'white',
        gap: 10,
    },
    errorBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    errorText: {
        fontSize: 13.5,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
    },
});
