import { BadgeCheck, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { SaleReceiptInput, StoreCurrency, StoreReceiptMode } from '@/shared/entities/SalesModule';import { formatMoney } from './format';


export interface SaleDraft {
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        total: number;
    }[];
    paymentMethodName?: string | null;
    customerName?: string | null;
    soldAtLabel: string;
    total: number;
    profit: number;
    currency: StoreCurrency;
    referenceCurrency?: StoreCurrency | null;
    referenceAmount?: number | null;
}

interface SaleConfirmModalProps {
    visible: boolean;
    draft: SaleDraft | null;
    submitting: boolean;
    onCancel: () => void;
    onConfirm: (receipt: SaleReceiptInput) => void;
    /** Recibo ya emitido (modo edición), si la venta tiene uno. */
    existingReceiptNumber?: string | null;
    /** Política de recibos de la tienda: ask | always | never. */
    receiptMode?: StoreReceiptMode;
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <TextMalet style={styles.label}>{label}</TextMalet>
            <TextMalet style={styles.value} numberOfLines={2}>
                {value}
            </TextMalet>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

/**
 * Confirmación previa al registro de una venta: muestra el borrador
 * completo y solo el botón "Registrar venta" ejecuta el POST.
 */
export default function SaleConfirmModal({
    visible,
    draft,
    submitting,
    onCancel,
    onConfirm,
    existingReceiptNumber,
    receiptMode = 'ask',
}: SaleConfirmModalProps) {
    const hasReference =
        draft?.referenceCurrency != null && draft?.referenceAmount != null;

    // Recibo: solo se puede pedir al registrar (una venta ya emitida ya lo tiene).
    const receiptLocked = existingReceiptNumber != null;
    const [receiptEnabled, setReceiptEnabled] = useState(false);
    const [customerName, setCustomerName] = useState('');

    /**
     * La política de la tienda puede fijar el recibo: `always` lo bloquea activo
     * y `never` bloqueado inactivo (solo el dueño puede cambiarla).
     */
    const modeLocked = receiptMode !== 'ask';
    const effectiveEnabled =
        receiptMode === 'always' ? true : receiptMode === 'never' ? false : receiptEnabled;

    const handleCancel = () => {
        setReceiptEnabled(false);
        setCustomerName('');
        onCancel();
    };

    const handleConfirm = () => {
        onConfirm({
            enabled: !receiptLocked && effectiveEnabled,
            ...(effectiveEnabled && customerName.trim()
                ? { customer_name: customerName.trim() }
                : {}),
        });
    };
    /**
     * Alto máximo del cuerpo (resumen + totales): el scroll empieza ahí.
     * Es la altura de la ventana menos lo que ocupan cabecera, drag-handle y
     * botones, así el "Registrar venta" siempre queda dentro de la pantalla.
     */
    const [maxBodyHeight] = useState(() => Dimensions.get('window').height * 0.34);

    return (
        <ModalOptions visible={visible && draft !== null} onClose={handleCancel} heightRatio={0.66}>
            <TextMalet style={styles.title}>Confirmar venta</TextMalet>
            <TextMalet style={styles.subtitle}>
                Revisa los datos antes de registrarla. Después podrás editarla o eliminarla.
            </TextMalet>

            {draft && (
                <View style={styles.body}>
                    <ScrollView
                        style={{ maxHeight: maxBodyHeight }}
                        contentContainerStyle={styles.bodyScroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                    >
                        <View style={styles.card}>
                            {draft.items.map((item, index) => (
                                <View key={`${item.productName}-${index}`}>
                                    {index > 0 && <Divider />}
                                    <View style={styles.itemRow}>
                                        <View style={{ flex: 1 }}>
                                            <TextMalet style={styles.itemName} numberOfLines={1}>
                                                {item.productName}
                                            </TextMalet>
                                            <TextMalet style={styles.itemSub}>
                                                {item.quantity} ×{' '}
                                                {formatMoney(item.unitPrice, draft.currency)}
                                            </TextMalet>
                                        </View>
                                        <TextMalet style={styles.itemTotal}>
                                            {formatMoney(item.total, draft.currency)}
                                        </TextMalet>
                                    </View>
                                </View>
                            ))}
                            <Divider />
                            <Row
                                label="Método de cobro"
                                value={draft.paymentMethodName ?? 'Sin método'}
                            />
                            <Divider />
                            <Row label="Cliente" value={draft.customerName ?? 'Sin cliente'} />
                            <Divider />
                            <Row label="Fecha" value={draft.soldAtLabel} />
                            {hasReference && (
                                <>
                                    <Divider />
                                    <Row
                                        label={`Referencia (${draft.referenceCurrency})`}
                                        value={`≈ ${formatMoney(
                                            Number(draft.referenceAmount),
                                            draft.referenceCurrency as StoreCurrency
                                        )}`}
                                    />
                                </>
                            )}
                        </View>

                        <View style={styles.totals}>
                            <View style={styles.totalsRow}>
                                <TextMalet style={styles.totalsLabel}>Total</TextMalet>
                                <TextMalet style={styles.totalsValue}>
                                    {formatMoney(draft.total, draft.currency)}
                                </TextMalet>
                            </View>
                            <View style={styles.totalsDivider} />
                            <View style={styles.totalsRow}>
                                <TextMalet style={styles.totalsLabel}>Ganancia</TextMalet>
                                <TextMalet
                                    style={[
                                        styles.totalsValue,
                                        { color: draft.profit >= 0 ? '#16a34a' : '#dc2626' },
                                    ]}
                                >
                                    {formatMoney(draft.profit, draft.currency)}
                                </TextMalet>
                            </View>
                        </View>

                        {/* Recibo */}
                        {receiptLocked ? (
                            <View style={styles.receiptCard}>
                                <View style={styles.receiptIcon}>
                                    <ReceiptText size={16} color="#111" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.receiptTitle}>
                                        Recibo emitido
                                    </TextMalet>
                                    <TextMalet style={styles.receiptSub}>
                                        {existingReceiptNumber}
                                    </TextMalet>
                                </View>
                            </View>
                        ) : modeLocked ? (
                            <View style={styles.receiptCard}>
                                <View style={styles.receiptIcon}>
                                    <ReceiptText size={16} color="#111" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.receiptTitle}>
                                        {effectiveEnabled ? 'Recibo automático' : 'Sin recibo'}
                                    </TextMalet>
                                    <TextMalet style={styles.receiptSub}>
                                        {effectiveEnabled
                                            ? 'Esta tienda está configurada para generar recibo en todas las ventas.'
                                            : 'Esta tienda está configurada para no generar recibo.'}
                                        {' · Solo el dueño puede cambiarlo.'}
                                    </TextMalet>
                                </View>
                                <Switch
                                    value={effectiveEnabled}
                                    disabled
                                    trackColor={{ false: '#d4d4d8', true: '#a1a1aa' }}
                                    thumbColor={effectiveEnabled ? '#000' : '#f4f4f5'}
                                />
                            </View>
                        ) : (
                            <View style={styles.receiptCard}>
                                <View style={styles.receiptIcon}>
                                    <ReceiptText size={16} color="#111" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.receiptTitle}>
                                        Generar recibo
                                    </TextMalet>
                                    <TextMalet style={styles.receiptSub}>
                                        Se emitirá un folio único de Breadriuss al registrar la
                                        venta.
                                    </TextMalet>
                                </View>
                                <Switch
                                    value={receiptEnabled}
                                    onValueChange={setReceiptEnabled}
                                    trackColor={{ false: '#d4d4d8', true: '#a1a1aa' }}
                                    thumbColor={receiptEnabled ? '#000' : '#f4f4f5'}
                                />
                            </View>
                        )}

                        {!receiptLocked && effectiveEnabled && (
                            <InputField
                                label="Facturar a (opcional)"
                                placeholder="Nombre del cliente"
                                value={customerName}
                                onChangeText={setCustomerName}
                                autoCapitalize="words"
                            />
                        )}
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button
                            text="Registrar venta"
                            icon={<BadgeCheck size={16} color="#fff" />}
                            onPress={handleConfirm}
                            loading={submitting}
                            style={styles.confirmBtn}
                        />
                        <Button
                            text="Volver a editar"
                            onPress={onCancel}
                            style={styles.cancelBtn}
                            labelStyle={styles.cancelLabel}
                        />
                    </View>
                </View>
            )}
        </ModalOptions>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
        marginTop: 4,
    },
    body: {
        marginTop: 14,
        flex: 1,
        gap: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        paddingHorizontal: 14,
    },
    bodyScroll: {
        gap: 14,
        paddingBottom: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        gap: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.45)',
    },
    value: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
        textAlign: 'right',
        flexShrink: 1,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
        borderStyle: 'dashed',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        gap: 12,
    },
    itemName: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
    itemSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    totals: {
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    totalsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        gap: 12,
    },
    totalsLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
    totalsValue: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.4,
    },
    totalsDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    receiptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    receiptIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    receiptTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    receiptSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
        lineHeight: 15,
    },
    actions: {
        gap: 8,
        paddingBottom: 8,
    },
    confirmBtn: {
        width: '100%',
    },
    cancelBtn: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    cancelLabel: {
        color: '#555',
    },
});
