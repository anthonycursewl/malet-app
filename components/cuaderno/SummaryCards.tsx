import { StyleSheet, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { currencyOf, formatMoney } from './format';
import { SummaryCardsSkeleton } from './Skeletons';

/** Tarjetas del resumen pre-computado (GET /sales/summary) en la moneda de la tienda. */
export default function SummaryCards() {
    const summary = useSalesModuleStore((s) => s.summary);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    if (!summary) {
        return (
            <View>
                <TextMalet style={styles.title}>Resumen</TextMalet>
                <SummaryCardsSkeleton />
            </View>
        );
    }

    const cards: { label: string; value: string; highlight?: boolean }[] = [
        { label: 'Ventas', value: summary ? String(summary.sales_count) : '—' },
        { label: 'Unidades', value: summary ? String(summary.units_sold) : '—' },
        { label: 'Ingresos', value: summary ? formatMoney(summary.revenue, currency) : '—' },
        { label: 'Costo', value: summary ? formatMoney(summary.cost, currency) : '—' },
        { label: 'Ganancia', value: summary ? formatMoney(summary.profit, currency) : '—', highlight: true },
        { label: 'Ticket prom.', value: summary ? formatMoney(summary.average_ticket, currency) : '—' },
    ];

    return (
        <View>
            <TextMalet style={styles.title}>Resumen</TextMalet>
            <View style={styles.grid}>
                {cards.map((c) => (
                    <View key={c.label} style={[styles.card, c.highlight && styles.cardHighlight]}>
                        <TextMalet style={[styles.cardLabel, c.highlight && styles.cardLabelHighlight]}>
                            {c.label}
                        </TextMalet>
                        <TextMalet style={[styles.cardValue, c.highlight && styles.cardValueHighlight]}>
                            {c.value}
                        </TextMalet>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    card: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 3,
    },
    cardHighlight: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
    },
    cardLabelHighlight: {
        color: 'rgba(255,255,255,0.6)',
    },
    cardValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    cardValueHighlight: {
        color: '#fff',
    },
});
