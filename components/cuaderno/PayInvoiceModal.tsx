import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { currencyOf, formatDateShort, formatMoney, notify } from '@/components/cuaderno/format';
import { Invoice, InvoicePaymentResult } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

interface PayInvoiceModalProps {
    visible: boolean;
    invoice: Invoice | null;
    onClose: () => void;
    onPaid: (result: InvoicePaymentResult) => void;
}

/**
 * Registrar el pago de una factura: en ese momento el backend crea la venta y
 * emite el recibo (nunca antes).
 */
export default function PayInvoiceModal({ visible, invoice, onClose, onPaid }: PayInvoiceModalProps) {
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const payInvoice = useSalesModuleStore((s) => s.payInvoice);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const [methodId, setMethodId] = useState<string | null>(null);
    const [paidAt, setPaidAt] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [receiptName, setReceiptName] = useState(invoice?.customer_name ?? '');
    const [paying, setPaying] = useState(false);

    const activeMethods = paymentMethods.filter((method) => method.active);

    const submit = async () => {
        if (!invoice) return;

        setPaying(true);
        const { result, error } = await payInvoice(invoice.id, {
            payment_method_id: methodId,
            paid_at: paidAt.toISOString(),
            ...(receiptName.trim() ? { receipt_customer_name: receiptName.trim() } : {}),
        });
        setPaying(false);

        if (error || !result) {
            notify('error', error ?? 'No se pudo registrar el pago.');
            return;
        }

        notify('success', `Pago registrado. Recibo ${result.receipt.number} emitido.`);
        onPaid(result);
    };

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.64}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <TextMalet style={styles.title}>Registrar pago</TextMalet>
                    <TextMalet style={styles.subtitle}>
                        Se registrará la venta y se emitirá el recibo de {invoice?.number ?? ''}.
                    </TextMalet>
                </View>

                {invoice && (
                    <View style={styles.amountCard}>
                        <TextMalet style={styles.amountLabel}>Total a cobrar</TextMalet>
                        <TextMalet style={styles.amountValue}>
                            {formatMoney(invoice.total, currency)}
                        </TextMalet>
                    </View>
                )}

                <View style={styles.group}>
                    <TextMalet style={styles.label}>Método de pago (opcional)</TextMalet>
                    <View style={styles.chipsRow}>
                        <TouchableOpacity
                            style={[styles.chip, methodId == null && styles.chipActive]}
                            onPress={() => setMethodId(null)}
                        >
                            <TextMalet
                                style={[styles.chipText, methodId == null && styles.chipTextActive]}
                            >
                                Sin método
                            </TextMalet>
                        </TouchableOpacity>
                        {activeMethods.map((method) => {
                            const active = methodId === method.id;
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setMethodId(active ? null : method.id)}
                                >
                                    <TextMalet
                                        style={[styles.chipText, active && styles.chipTextActive]}
                                    >
                                        {method.name}
                                    </TextMalet>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <InputField
                    label="Fecha de pago"
                    placeholder="Seleccionar fecha"
                    value={formatDateShort(paidAt)}
                    onPress={() => setShowPicker(true)}
                    icon={<Calendar size={16} color="#666" />}
                    rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                    onRightIconPress={() => setShowPicker(true)}
                />
                {showPicker && (
                    <DateTimePicker
                        value={paidAt}
                        mode="date"
                        onValueChange={(_, date) => {
                            setShowPicker(false);
                            setPaidAt(date);
                        }}
                        onDismiss={() => setShowPicker(false)}
                    />
                )}

                <InputField
                    label="Facturar a (recibo)"
                    placeholder="Nombre en el recibo"
                    value={receiptName}
                    onChangeText={setReceiptName}
                />

                <Button
                    text="Confirmar pago"
                    onPress={submit}
                    loading={paying}
                    style={styles.submit}
                />
            </ScrollView>
        </ModalOptions>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: 14,
        paddingHorizontal: 6,
        paddingTop: 2,
        paddingBottom: 10,
    },
    header: {
        gap: 4,
    },
    group: {
        gap: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    amountCard: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 14,
        padding: 12,
        backgroundColor: '#fafafa',
    },
    amountLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    amountValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.5,
        marginTop: 2,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    chipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    chipText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    chipTextActive: {
        color: '#fff',
    },
    submit: {
        marginTop: 4,
    },
});
