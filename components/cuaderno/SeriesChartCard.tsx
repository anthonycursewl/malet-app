import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import BarChart from '@/components/Analytics/BarChart';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SeriesPeriod } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { currencyOf, formatBucketLabel, formatMoneyCompact } from './format';
import { ChartSkeleton } from './Skeletons';

const PERIODS: { value: SeriesPeriod; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
];

/** Gráfica de ingresos por bucket (GET /sales/series) con selector de periodo. */
export default function SeriesChartCard() {
    const series = useSalesModuleStore((s) => s.series);
    const seriesPeriod = useSalesModuleStore((s) => s.seriesPeriod);
    const setSeriesPeriod = useSalesModuleStore((s) => s.setSeriesPeriod);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const data = (series?.data ?? []).map((b) => ({
        label: formatBucketLabel(b.bucket, seriesPeriod),
        value: Number(b.revenue ?? 0),
    }));

    const periodLabel = PERIODS.find((p) => p.value === seriesPeriod)?.label ?? 'Día';

    return (
        <View>
            <View style={styles.header}>
                <TextMalet style={styles.title}>Ingresos por {periodLabel.toLowerCase()}</TextMalet>
                <View style={styles.periods}>
                    {PERIODS.map((p) => {
                        const active = p.value === seriesPeriod;
                        return (
                            <TouchableOpacity
                                key={p.value}
                                style={[styles.periodChip, active && styles.periodChipActive]}
                                onPress={() => setSeriesPeriod(p.value)}
                            >
                                <TextMalet style={[styles.periodText, active && styles.periodTextActive]}>
                                    {p.label}
                                </TextMalet>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {series ? (
                <View style={styles.chartCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <BarChart
                            data={data}
                            height={180}
                            formatValue={(v) => formatMoneyCompact(v, currency)}
                        />
                    </ScrollView>
                </View>
            ) : (
                <ChartSkeleton />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 8,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        flex: 1,
    },
    periods: {
        flexDirection: 'row',
        gap: 6,
    },
    periodChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    periodChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    periodText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#555',
    },
    periodTextActive: {
        color: '#fff',
    },
    chartCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        overflow: 'hidden',
    },
});
