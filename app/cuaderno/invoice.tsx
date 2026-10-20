import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pencil, ReceiptText, Share2, ShoppingCart, Trash2, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import PayInvoiceModal from '@/components/cuaderno/PayInvoiceModal';
import { ReceiptDocSkeleton } from '@/components/cuaderno/Skeletons';
import { currencyOf, formatMoney, formatSaleDate, notify } from '@/components/cuaderno/format';
import { shareInvoicePdf } from '@/components/cuaderno/invoicePdf';
import {
    INVOICE_STATUS_OPTIONS,
    Invoice,
    InvoicePaymentResult,
    invoiceStatusLabel,
} from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

interface MetaRowProps {
    label: string;
    value: string;
    strong?: boolean;
}

/** Fila de metadatos del documento (número, fechas...). */
function MetaRow({ label, value, strong }: MetaRowProps) {
    return (
        <View style={styles.metaRow}>
            <TextMalet style={styles.metaLabel}>{label}</TextMalet>
            <TextMalet style={[styles.metaValue, strong && styles.metaValueStrong]}>
                {value}
            </TextMalet>
        </View>
    );
}

/** Fila de los totales del documento. */
function LineRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.lineRow}>
            <TextMalet style={styles.lineLabel}>{label}</TextMalet>
            <TextMalet style={styles.lineValue}>{value}</TextMalet>
        </View>
    );
}

/**
 * Documento de la factura con el mismo formato del recibo (logo, tabla y
 * totales). Se paga desde aquí: en ese momento se crea la venta y el recibo.
 */
export default function InvoiceScreen() {
    const { store: storeId, id: invoiceId } = useLocalSearchParams<{
        store: string;
        id: string;
    }>();
    const fetchInvoice = useSalesModuleStore((s) => s.fetchInvoice);
    const cancelInvoice = useSalesModuleStore((s) => s.cancelInvoice);
    const deleteInvoice = useSalesModuleStore((s) => s.deleteInvoice);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const storeCurrency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [payOpen, setPayOpen] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!invoiceId) {
            setErrorMsg('Factura no encontrada.');
            setLoading(false);
            return;
        }
        const { invoice: fetched, error } = await fetchInvoice(invoiceId);
        if (error || !fetched) {
            setErrorMsg(error ?? 'Factura no encontrada.');
            setLoading(false);
            return;
        }
        setInvoice(fetched);
        setLoading(false);
    }, [invoiceId, fetchInvoice]);

    // Al volver de editar/pagar, el documento se vuelve a leer.
    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const currency = invoice?.currency ?? storeCurrency;
    const isPending = invoice?.status === 'pending';
    const isPaid = invoice?.status === 'paid';
    const statusColor =
        INVOICE_STATUS_OPTIONS.find((option) => option.value === invoice?.status)?.color ??
        '#6b7280';

    const handleShare = async () => {
        if (!invoice) return;
        setSharing(true);
        const { error } = await shareInvoicePdf({
            invoice,
            storeName: currentStore?.name || 'Tienda',
            currency,
            storePhone: currentStore?.phone,
            storeEmail: currentStore?.email,
            storeAddress: currentStore?.address,
        });
        setSharing(false);
        if (error) notify('error', error);
    };

    const confirmCancel = () => {
        if (!invoice) return;
        Alert.alert(
            'Cancelar factura',
            'La factura quedará cancelada y no podrá pagarse. No se genera venta ni recibo.',
            [
                { text: 'Volver', style: 'cancel' },
                {
                    text: 'Cancelar factura',
                    style: 'destructive',
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const error = await cancelInvoice(invoice.id);
                            if (error) {
                                notify('error', error);
                                return;
                            }
                            notify('success', 'Factura cancelada.');
                            await load();
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ],
        );
    };

    const confirmDelete = () => {
        if (!invoice) return;
        Alert.alert('Eliminar factura', '¿Quieres quitar esta factura del listado?', [
            { text: 'Volver', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setBusy(true);
                    try {
                        const error = await deleteInvoice(invoice.id);
                        if (error) {
                            notify('error', error);
                            return;
                        }
                        notify('success', 'Factura eliminada.');
                        if (router.canGoBack()) router.back();
                    } finally {
                        setBusy(false);
                    }
                },
            },
        ]);
    };

    const onPaid = (result: InvoicePaymentResult) => {
        setPayOpen(false);
        setInvoice(result.invoice);
        // El recibo recién emitido es el documento de pago: se abre directo.
        router.push({
            pathname: '/cuaderno/receipt',
            params: { store: storeId, id: result.receipt.id },
        } as any);
    };

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader title="Factura" subtitle={invoice?.number ?? undefined} />

                {loading && !invoice ? (
                    <ReceiptDocSkeleton />
                ) : !invoice ? (
                    <View style={styles.errorBox}>
                        <TextMalet style={styles.errorTitle}>Factura no disponible</TextMalet>
                        <TextMalet style={styles.errorText}>
                            {errorMsg ?? 'Esta factura ya no existe.'}
                        </TextMalet>
                        <Button
                            text="Volver"
                            onPress={() => {
                                if (router.canGoBack()) router.back();
                            }}
                        />
                    </View>
                ) : (
                    <>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Cabecera del documento */}
                            <View style={styles.docHeader}>
                                <View style={styles.docHeaderTexts}>
                                    <TextMalet style={styles.docTitle}>Factura</TextMalet>
                                    <MetaRow
                                        label="Número de factura"
                                        value={invoice.number}
                                        strong
                                    />
                                    <MetaRow
                                        label="Fecha de emisión"
                                        value={formatSaleDate(invoice.issued_at)}
                                    />
                                    {invoice.due_at ? (
                                        <MetaRow
                                            label="Vence"
                                            value={formatSaleDate(invoice.due_at)}
                                        />
                                    ) : null}
                                    <View style={styles.metaRow}>
                                        <TextMalet style={styles.metaLabel}>Estado</TextMalet>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: `${statusColor}14` },
                                            ]}
                                        >
                                            <TextMalet
                                                style={[styles.statusText, { color: statusColor }]}
                                            >
                                                {invoiceStatusLabel(invoice.status)}
                                            </TextMalet>
                                        </View>
                                    </View>
                                </View>
                                <Image
                                    source={require('@/assets/images/malet/breadriuss_logo.png')}
                                    style={styles.docLogo}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Facturar a */}
                            <View style={styles.billingBlock}>
                                <TextMalet style={styles.billingLabel}>Facturar a</TextMalet>
                                <TextMalet style={styles.billingValue}>
                                    {invoice.customer_name?.trim() || 'Cliente no especificado'}
                                </TextMalet>
                                <TextMalet style={styles.billingStore}>
                                    {currentStore?.name || 'Tienda'}
                                </TextMalet>
                                {(() => {
                                    const phone = currentStore?.phone;
                                    const email = currentStore?.email;
                                    const address = currentStore?.address;
                                    if (!phone && !email && !address) return null;
                                    return (
                                        <View style={styles.issuerLines}>
                                            {phone ? (
                                                <TextMalet style={styles.issuerLine}>
                                                    {phone}
                                                </TextMalet>
                                            ) : null}
                                            {email ? (
                                                <TextMalet style={styles.issuerLine}>
                                                    {email}
                                                </TextMalet>
                                            ) : null}
                                            {address ? (
                                                <TextMalet style={styles.issuerLine}>
                                                    {address}
                                                </TextMalet>
                                            ) : null}
                                        </View>
                                    );
                                })()}
                            </View>

                            <TextMalet style={styles.amountLine}>
                                {formatMoney(invoice.total, currency)}
                                {isPaid && invoice.paid_at
                                    ? ` pagado el ${formatSaleDate(invoice.paid_at)}`
                                    : isPending
                                      ? ' pendiente de pago'
                                      : ' cancelada'}
                            </TextMalet>

                            {/* Tabla de conceptos */}
                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <TextMalet style={[styles.tableHeaderText, styles.colDesc]}>
                                        Descripción
                                    </TextMalet>
                                    <TextMalet style={[styles.tableHeaderText, styles.colCant]}>
                                        Cant.
                                    </TextMalet>
                                    <TextMalet style={[styles.tableHeaderText, styles.colPrice]}>
                                        Precio unitario
                                    </TextMalet>
                                    <TextMalet style={[styles.tableHeaderText, styles.colImporte]}>
                                        Importe
                                    </TextMalet>
                                </View>

                                {invoice.lines.map((line, index) => (
                                    <View
                                        key={`${line.product_id ?? 'concept'}-${index}`}
                                        style={styles.tableRow}
                                    >
                                        <View style={styles.colDesc}>
                                            <TextMalet style={styles.cellText}>
                                                {line.name}
                                            </TextMalet>
                                            {line.item_type === 'service' ? (
                                                <TextMalet style={styles.cellSub}>Servicio</TextMalet>
                                            ) : null}
                                        </View>
                                        <TextMalet style={[styles.cellText, styles.colCant]}>
                                            {line.quantity}
                                        </TextMalet>
                                        <TextMalet style={[styles.cellText, styles.colPrice]}>
                                            {formatMoney(line.unit_price, currency)}
                                        </TextMalet>
                                        <TextMalet style={[styles.cellText, styles.colImporte]}>
                                            {formatMoney(line.total, currency)}
                                        </TextMalet>
                                    </View>
                                ))}

                                {invoice.lines.length === 0 && (
                                    <TextMalet style={styles.tableEmpty}>
                                        Esta factura no tiene conceptos registrados.
                                    </TextMalet>
                                )}

                                {/* Totales alineados a la derecha, como en el formato */}
                                <View style={styles.totalsBlock}>
                                    <LineRow
                                        label="Subtotal"
                                        value={formatMoney(invoice.subtotal, currency)}
                                    />
                                    <LineRow
                                        label="Total"
                                        value={formatMoney(invoice.total, currency)}
                                    />
                                    {isPaid && (
                                        <LineRow
                                            label="Pagado"
                                            value={formatMoney(invoice.total, currency)}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Notas */}
                            {invoice.notes ? (
                                <View style={styles.notesBlock}>
                                    <TextMalet style={styles.blockTitle}>Notas</TextMalet>
                                    <TextMalet style={styles.notesText}>{invoice.notes}</TextMalet>
                                </View>
                            ) : null}

                            {/* Documentos generados al pagar */}
                            {isPaid && (
                                <View style={styles.block}>
                                    <TextMalet style={styles.blockTitle}>Documentos</TextMalet>
                                    {invoice.receipt_id && (
                                        <TouchableOpacity
                                            style={styles.docLink}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/cuaderno/receipt',
                                                    params: { store: storeId, id: invoice.receipt_id },
                                                } as any)
                                            }
                                        >
                                            <ReceiptText size={15} color="#111" />
                                            <TextMalet style={styles.docLinkText}>
                                                Ver recibo emitido
                                            </TextMalet>
                                        </TouchableOpacity>
                                    )}
                                    {invoice.sale_id && (
                                        <TouchableOpacity
                                            style={styles.docLink}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/cuaderno/sale-detail',
                                                    params: { store: storeId, id: invoice.sale_id },
                                                } as any)
                                            }
                                        >
                                            <ShoppingCart size={15} color="#111" />
                                            <TextMalet style={styles.docLinkText}>
                                                Ver venta asociada
                                            </TextMalet>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Acciones del documento (solo si aún no está pagada) */}
                            {!isPaid && (
                                <View style={styles.inlineActions}>
                                    {isPending && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.inlineAction}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/cuaderno/invoice-form',
                                                        params: { store: storeId, id: invoice.id },
                                                    } as any)
                                                }
                                            >
                                                <Pencil size={14} color="#111" />
                                                <TextMalet style={styles.inlineActionText}>
                                                    Editar
                                                </TextMalet>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.inlineAction}
                                                onPress={confirmCancel}
                                            >
                                                <X size={14} color="#dc2626" />
                                                <TextMalet
                                                    style={[
                                                        styles.inlineActionText,
                                                        styles.inlineActionDanger,
                                                    ]}
                                                >
                                                    Cancelar
                                                </TextMalet>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    <TouchableOpacity
                                        style={styles.inlineAction}
                                        onPress={confirmDelete}
                                    >
                                        <Trash2 size={14} color="#dc2626" />
                                        <TextMalet
                                            style={[
                                                styles.inlineActionText,
                                                styles.inlineActionDanger,
                                            ]}
                                        >
                                            Eliminar
                                        </TextMalet>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        {/* Acciones fijas abajo */}
                        <View style={styles.footer}>
                            {isPending && (
                                <Button
                                    text="Registrar pago"
                                    onPress={() => setPayOpen(true)}
                                    loading={busy}
                                    style={styles.saleBtn}
                                />
                            )}
                            <Button
                                text="Compartir PDF"
                                icon={<Share2 size={15} color="#fff" />}
                                onPress={handleShare}
                                loading={sharing}
                                style={styles.saleBtn}
                            />
                        </View>
                    </>
                )}
            </View>

            {payOpen && (
                <PayInvoiceModal
                    visible
                    invoice={invoice}
                    onClose={() => setPayOpen(false)}
                    onPaid={onPaid}
                />
            )}
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
    docHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 12,
    },
    docHeaderTexts: {
        flex: 1,
        gap: 3,
    },
    docTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.4,
        marginBottom: 2,
    },
    docLogo: {
        width: 38,
        height: 39,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaLabel: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
    },
    metaValue: {
        fontSize: 11.5,
        fontWeight: '600',
        color: '#111',
    },
    metaValueStrong: {
        fontWeight: '800',
    },
    statusBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    billingBlock: {
        gap: 2,
    },
    billingLabel: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
    },
    billingValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    billingStore: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.5)',
    },
    issuerLines: {
        marginTop: 4,
    },
    issuerLine: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
        lineHeight: 16,
    },
    amountLine: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    table: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fafafa',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    cellText: {
        fontSize: 12,
        color: '#222',
    },
    cellSub: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#7c3aed',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginTop: 1,
    },
    colDesc: {
        flex: 1,
    },
    colCant: {
        width: 34,
        textAlign: 'center',
    },
    colPrice: {
        width: 84,
        textAlign: 'right',
    },
    colImporte: {
        width: 84,
        textAlign: 'right',
    },
    tableEmpty: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        paddingVertical: 14,
    },
    totalsBlock: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
        marginLeft: '34%',
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 6,
    },
    lineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    lineLabel: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
    },
    lineValue: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#111',
    },
    notesBlock: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    block: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    blockTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111',
        paddingTop: 8,
        paddingBottom: 4,
    },
    notesText: {
        fontSize: 12,
        color: '#444',
        lineHeight: 17,
        paddingBottom: 8,
    },
    docLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.07)',
    },
    docLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    inlineActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 18,
        paddingHorizontal: 4,
        paddingTop: 2,
    },
    inlineAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    inlineActionText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111',
    },
    inlineActionDanger: {
        color: '#dc2626',
    },
    saleBtn: {
        width: '100%',
    },
    footer: {
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        backgroundColor: 'white',
        gap: 8,
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
