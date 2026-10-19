import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Share2, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import ModalOptions from '@/components/shared/ModalOptions';
import { formatMoney, formatSaleDate, notify } from '@/components/cuaderno/format';
import { ReceiptDocSkeleton } from '@/components/cuaderno/Skeletons';
import { shareReceiptPdf } from '@/components/cuaderno/receiptPdf';
import { useDeleteReceipt } from '@/components/cuaderno/useDeleteReceipt';
import DeletingOverlay from '@/components/cuaderno/DeletingOverlay';
import { Receipt, StoreCurrency } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

interface MetaRowProps {
    label: string;
    value: string;
    strong?: boolean;
}

/** Fila de metadatos del documento (número, fecha de pago...). */
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

/** Fila de la tabla de conceptos. */
function LineRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.lineRow}>
            <TextMalet style={styles.lineLabel}>{label}</TextMalet>
            <TextMalet style={styles.lineValue}>{value}</TextMalet>
        </View>
    );
}

/** Documento del recibo con el formato impreso (folio R-BRD-…). */
export default function ReceiptScreen() {
    const { store: storeId, id: receiptId } = useLocalSearchParams<{ store: string; id?: string }>();
    const fetchReceipt = useSalesModuleStore((s) => s.fetchReceipt);
    const currentStore = useSalesModuleStore((s) => s.currentStore);

    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const updateReceipt = useSalesModuleStore((s) => s.updateReceipt);
    const [customerEditOpen, setCustomerEditOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [savingCustomer, setSavingCustomer] = useState(false);
    /** Borrado del recibo (solo el dueño de la tienda). */
    const { isOwner, deleting, confirmDelete } = useDeleteReceipt();

    const openCustomerEdit = () => {
        setCustomerName(receipt?.customer_name ?? '');
        setCustomerEditOpen(true);
    };

    const saveCustomer = async () => {
        if (!receiptId) return;
        setSavingCustomer(true);
        const value = customerName.trim();
        const err = await updateReceipt(receiptId, value || null);
        setSavingCustomer(false);
        if (err) {
            notify('error', err);
            return;
        }
        setReceipt((prev) => (prev ? { ...prev, customer_name: value || null } : prev));
        setCustomerEditOpen(false);
        notify('success', 'Nombre del cliente corregido.');
    };

    const handleShare = async () => {
        if (!receipt) return;
        setSharing(true);
        const { error } = await shareReceiptPdf({
            receipt,
            storeName: receipt.store_name?.trim() || currentStore?.name || 'Tienda',
            currency: receipt.currency ?? 'Bs',
            storePhone: receipt.store_phone ?? currentStore?.phone,
            storeEmail: receipt.store_email ?? currentStore?.email,
            storeAddress: receipt.store_address ?? currentStore?.address,
        });
        setSharing(false);
        if (error) notify('error', error);
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!receiptId) {
                setErrorMsg('Recibo no encontrado.');
                setLoading(false);
                return;
            }
            const res = await fetchReceipt(receiptId);
            if (!mounted) return;
            if (res.error || !res.receipt) {
                setErrorMsg(res.error ?? 'Recibo no encontrado.');
                setLoading(false);
                return;
            }
            setReceipt(res.receipt);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [receiptId, fetchReceipt]);

    const currency: StoreCurrency = receipt?.currency ?? 'Bs';
    const lines = receipt?.lines ?? [];
    const payments = receipt?.payments ?? [];

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader title="Recibo" subtitle={receipt?.number ?? undefined} />

                {loading && !receipt ? (
                    <ReceiptDocSkeleton />
                ) : !receipt ? (
                    <View style={styles.errorBox}>
                        <TextMalet style={styles.errorTitle}>Recibo no disponible</TextMalet>
                        <TextMalet style={styles.errorText}>
                            {errorMsg ?? 'Este recibo ya no existe.'}
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
                                <TextMalet style={styles.docTitle}>Recibo</TextMalet>
                                <MetaRow label="Número de recibo" value={receipt.number} strong />
                                <MetaRow
                                    label="Fecha de pago"
                                    value={formatSaleDate(receipt.issued_at)}
                                />
                            </View>
                            <Image
                                source={require('@/assets/images/malet/breadriuss_logo.png')}
                                style={styles.docLogo}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Facturar a */}
                        <View style={styles.billingBlock}>
                            <View style={styles.billingHeader}>
                                <TextMalet style={styles.billingLabel}>Facturar a</TextMalet>
                                <TouchableOpacity
                                    onPress={openCustomerEdit}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Pencil size={13} color="#555" />
                                </TouchableOpacity>
                            </View>
                            <TextMalet style={styles.billingValue}>
                                {receipt.customer_name?.trim() || 'Cliente no especificado'}
                            </TextMalet>
                            <TextMalet style={styles.billingStore}>
                                {receipt.store_name?.trim() ||
                                    currentStore?.name ||
                                    'Tienda'}
                            </TextMalet>
                            {(() => {
                                const phone = receipt.store_phone ?? currentStore?.phone;
                                const email = receipt.store_email ?? currentStore?.email;
                                const address = receipt.store_address ?? currentStore?.address;
                                if (!phone && !email && !address) return null;
                                return (
                                    <View style={styles.issuerLines}>
                                        {phone ? (
                                            <TextMalet style={styles.issuerLine}>{phone}</TextMalet>
                                        ) : null}
                                        {email ? (
                                            <TextMalet style={styles.issuerLine}>{email}</TextMalet>
                                        ) : null}
                                        {address ? (
                                            <TextMalet style={styles.issuerLine}>{address}</TextMalet>
                                        ) : null}
                                    </View>
                                );
                            })()}
                        </View>

                        <TextMalet style={styles.amountLine}>
                            {formatMoney(receipt.total, currency)} pagado el{' '}
                            {formatSaleDate(receipt.issued_at)}
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

                            {lines.map((line, index) => (
                                <View key={`${line.product_id}-${index}`} style={styles.tableRow}>
                                    <View style={styles.colDesc}>
                                        <TextMalet style={styles.cellText}>
                                            {line.product_name}
                                        </TextMalet>
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

                            {lines.length === 0 && (
                                <TextMalet style={styles.tableEmpty}>
                                    Esta venta no tiene líneas registradas.
                                </TextMalet>
                            )}

                            {/* Totales alineados a la derecha, como en el formato */}
                            <View style={styles.totalsBlock}>
                                <LineRow
                                    label="Subtotal"
                                    value={formatMoney(receipt.subtotal, currency)}
                                />
                                <LineRow
                                    label="Total"
                                    value={formatMoney(receipt.total, currency)}
                                />
                                <LineRow
                                    label="Importe pagado"
                                    value={formatMoney(receipt.paid_amount, currency)}
                                />
                            </View>
                        </View>

                        {/* Historial de pagos */}
                        {payments.length > 0 && (
                            <View style={styles.historyBlock}>
                                <TextMalet style={styles.historyTitle}>Historial de pagos</TextMalet>
                                <View style={styles.historyHeader}>
                                    <TextMalet style={[styles.tableHeaderText, styles.colDesc]}>
                                        Método de pago
                                    </TextMalet>
                                    <TextMalet style={[styles.tableHeaderText, styles.colImporte]}>
                                        Fecha
                                    </TextMalet>
                                    <TextMalet style={[styles.tableHeaderText, styles.colImporte]}>
                                        Importe pagado
                                    </TextMalet>
                                </View>
                                {payments.map((payment, index) => (
                                    <View key={index} style={styles.historyRow}>
                                        <TextMalet style={[styles.cellText, styles.colDesc]}>
                                            {payment.payment_method_name ?? 'Sin método'}
                                        </TextMalet>
                                        <TextMalet style={[styles.cellText, styles.colImporte]}>
                                            {formatSaleDate(payment.paid_at)}
                                        </TextMalet>
                                        <TextMalet style={[styles.cellText, styles.colImporte]}>
                                            {formatMoney(payment.amount, currency)}
                                        </TextMalet>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Button
                            text="Ver venta asociada"
                            onPress={() =>
                                router.push({
                                    pathname: '/cuaderno/sale-detail',
                                    params: { store: storeId, id: receipt.sale_id },
                                } as any)
                            }
                            style={styles.saleBtn}
                        />
                    </ScrollView>

                    {/* Acciones fijas abajo */}
                    <View style={styles.footer}>
                        <Button
                            text="Compartir PDF"
                            icon={<Share2 size={15} color="#fff" />}
                            onPress={handleShare}
                            loading={sharing}
                            style={styles.saleBtn}
                        />
                        {isOwner && (
                            <Button
                                text="Eliminar recibo"
                                icon={<Trash2 size={15} color="#dc2626" />}
                                onPress={() => confirmDelete(receipt, () => router.back())}
                                loading={deleting}
                                style={[styles.saleBtn, styles.dangerBtn]}
                                labelStyle={styles.dangerLabel}
                            />
                        )}
                    </View>

                    <DeletingOverlay visible={deleting} label="Eliminando recibo…" />
                    </>
                )}
            </View>

            <ModalOptions
                visible={customerEditOpen}
                onClose={() => setCustomerEditOpen(false)}
                heightRatio={0.45}
            >
                <TextMalet style={styles.editTitle}>Corregir “Facturar a”</TextMalet>
                <View style={styles.editBody}>
                    <InputField
                        label="Nombre del cliente"
                        placeholder="Ej: Ana Pérez"
                        value={customerName}
                        onChangeText={setCustomerName}
                        autoCapitalize="words"
                    />
                    <TextMalet style={styles.editHint}>
                        Solo se corrige el nombre: los importes y las líneas del recibo no cambian.
                        La corrección queda auditada.
                    </TextMalet>
                    <Button text="Guardar" onPress={saveCustomer} loading={savingCustomer} />
                </View>
            </ModalOptions>
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
    billingBlock: {
        gap: 2,
    },
    billingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    issuerLines: {
        marginTop: 4,
    },
    issuerLine: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
        lineHeight: 16,
    },
    editTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    editBody: {
        gap: 12,
        marginTop: 12,
    },
    editHint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
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
    historyBlock: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    historyTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111',
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 4,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 7,
        paddingHorizontal: 10,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 10,
    },
    saleBtn: {
        width: '100%',
    },
    dangerBtn: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
    },
    dangerLabel: {
        color: '#dc2626',
    },
    footer: {
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        backgroundColor: 'white',
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
