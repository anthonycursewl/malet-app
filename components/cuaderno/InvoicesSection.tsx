import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { FileText, Plus } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import SectionTitle from './SectionTitle';
import { currencyOf, formatMoney, formatSaleDate } from './format';
import { ListRowsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import {
    INVOICE_STATUS_OPTIONS,
    Invoice,
    InvoiceStatus,
    invoiceStatusLabel,
} from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

function statusColor(status: InvoiceStatus): string {
    return INVOICE_STATUS_OPTIONS.find((option) => option.value === status)?.color ?? '#6b7280';
}

/** Fila de una factura con su estado y total. */
function InvoiceRow({
    invoice,
    currency,
    onPress,
}: {
    invoice: Invoice;
    currency: ReturnType<typeof currencyOf>;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rowIcon}>
                <FileText size={16} color="#111" />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.rowTitleLine}>
                    <TextMalet style={styles.rowNumber} numberOfLines={1}>
                        {invoice.number}
                    </TextMalet>
                    <View style={[styles.badge, { backgroundColor: `${statusColor(invoice.status)}14` }]}>
                        <TextMalet style={[styles.badgeText, { color: statusColor(invoice.status) }]}>
                            {invoiceStatusLabel(invoice.status)}
                        </TextMalet>
                    </View>
                </View>
                <TextMalet style={styles.rowSub} numberOfLines={1}>
                    {invoice.customer_name ? `${invoice.customer_name} · ` : ''}
                    {formatSaleDate(invoice.issued_at)}
                    {invoice.lines.length > 1 ? ` · ${invoice.lines.length} conceptos` : ''}
                </TextMalet>
            </View>
            <TextMalet style={styles.rowTotal}>{formatMoney(invoice.total, currency)}</TextMalet>
        </TouchableOpacity>
    );
}

/**
 * Sección "Facturas": documentos que detallan lo que se cobrará. Se convierten
 * en venta + recibo solo al pagarse.
 */
export default function InvoicesSection({ storeId }: { storeId: string }) {
    const headerScroll = useStoreHeaderScroll();
    const invoices = useSalesModuleStore((s) => s.invoices);
    const invoicesLoading = useSalesModuleStore((s) => s.invoicesLoading);
    const invoiceStatus = useSalesModuleStore((s) => s.invoiceStatus);
    const invoiceTotals = useSalesModuleStore((s) => s.invoiceTotals);
    const loadInvoices = useSalesModuleStore((s) => s.loadInvoices);
    const setInvoiceStatus = useSalesModuleStore((s) => s.setInvoiceStatus);
    const loadInvoiceTotals = useSalesModuleStore((s) => s.loadInvoiceTotals);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    useEffect(() => {
        loadInvoices({ refresh: true });
        loadInvoiceTotals();
    }, [loadInvoices, loadInvoiceTotals]);

    const filters: { value: InvoiceStatus | null; label: string }[] = [
        { value: null, label: 'Todas' },
        ...INVOICE_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
        })),
    ];

    const header = (
        <View style={styles.header}>
            <TextMalet style={styles.description}>
                Crea la factura con el desglose de productos y servicios. El recibo se emite únicamente cuando
                el cliente paga.
            </TextMalet>

            {/* Por cobrar */}
            <View style={styles.summaryCard}>
                <View style={{ flex: 1 }}>
                    <TextMalet style={styles.summaryLabel}>Por cobrar</TextMalet>
                    <TextMalet style={styles.summaryValue}>
                        {formatMoney(invoiceTotals?.pending_total ?? 0, currency)}
                    </TextMalet>
                    <TextMalet style={styles.summaryHint}>
                        {invoiceTotals?.pending_count ?? 0}{' '}
                        {(invoiceTotals?.pending_count ?? 0) === 1
                            ? 'factura pendiente'
                            : 'facturas pendientes'}
                    </TextMalet>
                </View>
                <View style={styles.summaryDivider} />
                <View style={{ flex: 1 }}>
                    <TextMalet style={styles.summaryLabel}>Cobrado</TextMalet>
                    <TextMalet style={[styles.summaryValue, { color: '#15803d' }]}>
                        {formatMoney(invoiceTotals?.paid_total ?? 0, currency)}
                    </TextMalet>
                    <TextMalet style={styles.summaryHint}>
                        {invoiceTotals?.paid_count ?? 0}{' '}
                        {(invoiceTotals?.paid_count ?? 0) === 1 ? 'factura pagada' : 'facturas pagadas'}
                    </TextMalet>
                </View>
            </View>

            <Button
                text="Nueva factura"
                icon={<Plus size={15} color="#fff" />}
                onPress={() =>
                    router.push({
                        pathname: '/cuaderno/invoice-form',
                        params: { store: storeId },
                    } as any)
                }
                style={styles.newButton}
            />

            <View style={styles.chipsRow}>
                {filters.map((filter) => {
                    const active = filter.value === invoiceStatus;
                    return (
                        <TouchableOpacity
                            key={filter.label}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setInvoiceStatus(filter.value)}
                        >
                            <TextMalet style={[styles.chipText, active && styles.chipTextActive]}>
                                {filter.label}
                            </TextMalet>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <SectionTitle icon={FileText}>Facturas</SectionTitle>
        </View>
    );

    return (
        <View style={styles.wrap}>
            <FlashList
                {...headerScroll}
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <InvoiceRow
                        invoice={item}
                        currency={currency}
                        onPress={() =>
                            router.push({
                                pathname: '/cuaderno/invoice',
                                params: { store: storeId, id: item.id },
                            } as any)
                        }
                    />
                )}
                ListHeaderComponent={header}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.4}
                onEndReached={() => loadInvoices({ refresh: false })}
                onRefresh={() => {
                    loadInvoices({ refresh: true });
                    loadInvoiceTotals();
                }}
                refreshing={invoicesLoading && invoices.length === 0}
                ListEmptyComponent={
                    invoicesLoading ? (
                        <ListRowsSkeleton rows={4} />
                    ) : (
                        <View style={styles.empty}>
                            <TextMalet style={styles.emptyTitle}>Aún no hay facturas</TextMalet>
                            <TextMalet style={styles.emptyText}>
                                Crea una factura con tus servicios o productos y emite el recibo cuando te
                                paguen.
                            </TextMalet>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    header: {
        gap: 14,
        paddingBottom: 8,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    summaryValue: {
        fontSize: 19,
        fontWeight: '700',
        color: '#b45309',
        letterSpacing: -0.4,
        marginTop: 2,
    },
    summaryHint: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.07)',
    },
    newButton: {
        alignSelf: 'flex-start',
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
    rowTitleLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
    },
    rowNumber: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
        flexShrink: 1,
    },
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 9.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
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
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    emptyText: {
        fontSize: 12.5,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
});
