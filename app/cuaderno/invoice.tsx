import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FileText, Pencil, ReceiptText, Share2, ShoppingCart, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

/** Detalle de una factura: pagar (emite el recibo), editar, cancelar y PDF. */
export default function InvoiceDetailScreen() {
    const { store: storeId, id: invoiceId } = useLocalSearchParams<{
        store: string;
        id: string;
    }>();
    const fetchInvoice = useSalesModuleStore((s) => s.fetchInvoice);
    const cancelInvoice = useSalesModuleStore((s) => s.cancelInvoice);
    const deleteInvoice = useSalesModuleStore((s) => s.deleteInvoice);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const currency = useSalesModuleStore((s) => currencyOf(currentStore));

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [payOpen, setPayOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!invoiceId) return;
        const { invoice: fetched, error } = await fetchInvoice(invoiceId);
        if (error || !fetched) {
            setLoading(false);
            notify('error', error ?? 'Factura no encontrada.');
            return;
        }
        setInvoice(fetched);
        setLoading(false);
    }, [invoiceId, fetchInvoice]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const statusColor =
        INVOICE_STATUS_OPTIONS.find((option) => option.value === invoice?.status)?.color ?? '#6b7280';

    const sharePdf = async () => {
        if (!invoice) return;
        await shareInvoicePdf({
            invoice,
            storeName: currentStore?.name ?? 'Malet Sales',
            currency: invoice.currency ?? currency,
            storePhone: currentStore?.phone,
            storeEmail: currentStore?.email,
            storeAddress: currentStore?.address,
        });
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
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.dismissTo(`/cuaderno/store?store=${storeId}` as any);
                        }
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

    const isPending = invoice?.status === 'pending';
    const isPaid = invoice?.status === 'paid';

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader title="Factura" subtitle={invoice?.number} />

                {loading && !invoice ? (
                    <ReceiptDocSkeleton />
                ) : !invoice ? (
                    <View style={styles.errorBox}>
                        <TextMalet style={styles.errorTitle}>Factura no disponible</TextMalet>
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
                            <View style={styles.card}>
                                <View style={styles.docHeader}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.numberRow}>
                                            <FileText size={16} color="#111" />
                                            <TextMalet style={styles.number}>{invoice.number}</TextMalet>
                                        </View>
                                        <TextMalet style={styles.meta}>
                                            Emitida {formatSaleDate(invoice.issued_at)}
                                        </TextMalet>
                                        {invoice.due_at && (
                                            <TextMalet style={styles.meta}>
                                                Vence {formatSaleDate(invoice.due_at)}
                                            </TextMalet>
                                        )}
                                        {invoice.paid_at && (
                                            <TextMalet style={styles.meta}>
                                                Pagada {formatSaleDate(invoice.paid_at)}
                                            </TextMalet>
                                        )}
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: `${statusColor}14` }]}>
                                        <TextMalet style={[styles.badgeText, { color: statusColor }]}>
                                            {invoiceStatusLabel(invoice.status)}
                                        </TextMalet>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <TextMalet style={styles.label}>Facturar a</TextMalet>
                                <TextMalet style={styles.customer}>
                                    {invoice.customer_name?.trim() || 'Cliente no especificado'}
                                </TextMalet>
                                <TextMalet style={styles.store}>
                                    {currentStore?.name ?? 'Malet Sales'}
                                </TextMalet>
                            </View>

                            {/* Conceptos */}
                            <View style={styles.card}>
                                <TextMalet style={styles.sectionTitle}>Conceptos</TextMalet>
                                {invoice.lines.map((line, index) => (
                                    <View
                                        key={`${line.product_id ?? 'concept'}-${index}`}
                                        style={styles.line}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <TextMalet style={styles.lineName} numberOfLines={2}>
                                                {line.name}
                                            </TextMalet>
                                            <TextMalet style={styles.lineSub}>
                                                {line.quantity} × {formatMoney(line.unit_price, currency)}
                                                {line.item_type === 'service' ? ' · Servicio' : ''}
                                            </TextMalet>
                                        </View>
                                        <TextMalet style={styles.lineTotal}>
                                            {formatMoney(line.total, currency)}
                                        </TextMalet>
                                    </View>
                                ))}

                                <View style={styles.divider} />

                                <View style={styles.totalRow}>
                                    <TextMalet style={styles.totalLabel}>Subtotal</TextMalet>
                                    <TextMalet style={styles.totalValue}>
                                        {formatMoney(invoice.subtotal, currency)}
                                    </TextMalet>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextMalet style={styles.grandLabel}>Total</TextMalet>
                                    <TextMalet style={styles.grandValue}>
                                        {formatMoney(invoice.total, currency)}
                                    </TextMalet>
                                </View>
                            </View>

                            {invoice.notes ? (
                                <View style={styles.card}>
                                    <TextMalet style={styles.sectionTitle}>Notas</TextMalet>
                                    <TextMalet style={styles.notes}>{invoice.notes}</TextMalet>
                                </View>
                            ) : null}

                            {isPaid && (
                                <View style={styles.card}>
                                    <TextMalet style={styles.sectionTitle}>Documentos</TextMalet>
                                    <TouchableOpacity
                                        style={styles.docLink}
                                        onPress={() =>
                                            invoice.receipt_id &&
                                            router.push({
                                                pathname: '/cuaderno/receipt',
                                                params: { store: storeId, id: invoice.receipt_id },
                                            } as any)
                                        }
                                    >
                                        <ReceiptText size={16} color="#111" />
                                        <TextMalet style={styles.docLinkText}>Ver recibo</TextMalet>
                                    </TouchableOpacity>
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
                                            <ShoppingCart size={16} color="#111" />
                                            <TextMalet style={styles.docLinkText}>Ver venta</TextMalet>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        {/* Acciones */}
                        <View style={styles.footer}>
                            {isPending && (
                                <Button
                                    text="Registrar pago"
                                    onPress={() => setPayOpen(true)}
                                    loading={busy}
                                    style={styles.primary}
                                />
                            )}

                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.action} onPress={sharePdf}>
                                    <Share2 size={16} color="#111" />
                                    <TextMalet style={styles.actionText}>Compartir PDF</TextMalet>
                                </TouchableOpacity>

                                {isPending && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.action}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/cuaderno/invoice-form',
                                                    params: { store: storeId, id: invoice.id },
                                                } as any)
                                            }
                                        >
                                            <Pencil size={16} color="#111" />
                                            <TextMalet style={styles.actionText}>Editar</TextMalet>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.action} onPress={confirmCancel}>
                                            <X size={16} color="#dc2626" />
                                            <TextMalet style={[styles.actionText, { color: '#dc2626' }]}>
                                                Cancelar
                                            </TextMalet>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {!isPaid && (
                                    <TouchableOpacity style={styles.action} onPress={confirmDelete}>
                                        <TextMalet style={[styles.actionText, { color: '#dc2626' }]}>
                                            Eliminar
                                        </TextMalet>
                                    </TouchableOpacity>
                                )}
                            </View>
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
        paddingHorizontal: 5,
    },
    scrollContent: {
        paddingBottom: 24,
        gap: 12,
    },
    card: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 8,
        backgroundColor: '#fff',
    },
    docHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    numberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    number: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.2,
    },
    meta: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.07)',
        marginVertical: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    customer: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },
    store: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    line: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    lineName: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
    lineSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
    },
    lineTotal: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.5)',
    },
    totalValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    grandLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    grandValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    notes: {
        fontSize: 12.5,
        color: '#444',
        lineHeight: 18,
    },
    docLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingVertical: 9,
    },
    docLinkText: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 10,
        paddingBottom: 14,
        gap: 8,
    },
    primary: {
        width: '100%',
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        paddingHorizontal: 2,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    actionText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111',
    },
    errorBox: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
        paddingHorizontal: 24,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
});
