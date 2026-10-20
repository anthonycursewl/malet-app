import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import BarChart from '@/components/gym/BarChart';
import BodyMetricModal from '@/components/gym/BodyMetricModal';
import GymHeader from '@/components/gym/GymHeader';
import { formatVolume, formatWeight, formatWorkoutDate, notify } from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    BODY_METRIC_LABELS,
    BODY_METRIC_TRENDS,
    BodyMetricMetric,
    GymBodyMetric,
    GymBodyMetricInput,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Medidas corporales: última entrada, tendencia y historial editable. */
export default function GymMeasurementsScreen() {
    const metrics = useGymStore((s) => s.bodyMetrics);
    const loading = useGymStore((s) => s.metricsLoading);
    const pagination = useGymStore((s) => s.metricsPagination);
    const latest = useGymStore((s) => s.latestMetric);
    const trend = useGymStore((s) => s.metricTrend);
    const trendMetric = useGymStore((s) => s.metricTrendMetric);

    const loadBodyMetrics = useGymStore((s) => s.loadBodyMetrics);
    const loadLatestMetric = useGymStore((s) => s.loadLatestMetric);
    const loadMetricTrend = useGymStore((s) => s.loadMetricTrend);
    const upsertBodyMetric = useGymStore((s) => s.upsertBodyMetric);
    const updateBodyMetric = useGymStore((s) => s.updateBodyMetric);
    const deleteBodyMetric = useGymStore((s) => s.deleteBodyMetric);

    const [editing, setEditing] = useState<GymBodyMetric | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void loadBodyMetrics({ refresh: true });
        void loadLatestMetric();
        void loadMetricTrend(trendMetric);
    }, [loadBodyMetrics, loadLatestMetric, loadMetricTrend, trendMetric]);

    const submit = async (body: GymBodyMetricInput): Promise<string | null> => {
        setSaving(true);
        const error =
            editing === 'new'
                ? await upsertBodyMetric(body)
                : editing
                  ? await updateBodyMetric(editing.id, body)
                  : 'No hay medida que guardar.';
        setSaving(false);
        return error;
    };

    const confirmDelete = (metric: GymBodyMetric) => {
        Alert.alert('Eliminar medida', 'Dejará de contar en tus tendencias.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    const error = await deleteBodyMetric(metric.id);
                    if (error) notify('error', error);
                    else notify('success', 'Medida eliminada.');
                },
            },
        ]);
    };

    const renderMetric = useCallback(
        ({ item }: { item: GymBodyMetric }) => (
            <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setEditing(item)}
                onLongPress={() => confirmDelete(item)}
            >
                <View style={styles.rowLeft}>
                    <TextMalet style={styles.rowDate}>{formatWorkoutDate(item.date)}</TextMalet>
                    <TextMalet style={styles.rowSub} numberOfLines={1}>
                        {item.weight_kg != null ? formatWeight(item.weight_kg) : '—'}
                        {item.body_fat_pct != null ? ` · ${item.body_fat_pct}% grasa` : ''}
                        {item.muscle_mass_kg != null
                            ? ` · ${formatWeight(item.muscle_mass_kg)} músculo`
                            : ''}
                    </TextMalet>
                </View>
                {item.bmi != null ? (
                    <TextMalet style={styles.rowBmi}>IMC {item.bmi}</TextMalet>
                ) : null}
            </TouchableOpacity>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const keyExtractor = useCallback((item: GymBodyMetric) => item.id, []);

    const trendData = (trend?.data ?? []).map((point) => ({
        label: point.date.slice(8, 10),
        value: point.value,
    }));

    const header = (
        <View style={styles.header}>
            {/* Última medida */}
            <View style={styles.statsGrid}>
                <Stat label="Peso" value={latest ? formatWeight(latest.weight_kg) : '—'} />
                <Stat
                    label="Grasa"
                    value={latest?.body_fat_pct != null ? `${latest.body_fat_pct} %` : '—'}
                />
                <Stat
                    label="Músculo"
                    value={latest ? formatWeight(latest.muscle_mass_kg) : '—'}
                />
                <Stat label="IMC" value={latest?.bmi != null ? String(latest.bmi) : '—'} />
            </View>

            {/* Tendencia */}
            <View style={styles.card}>
                <TextMalet style={styles.cardTitle}>Tendencia</TextMalet>

                <View style={styles.chips}>
                    {BODY_METRIC_TRENDS.map((metric) => {
                        const active = trendMetric === metric;
                        return (
                            <TouchableOpacity
                                key={metric}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => void loadMetricTrend(metric)}
                                activeOpacity={0.7}
                            >
                                <TextMalet
                                    style={[styles.chipText, active && styles.chipTextActive]}
                                >
                                    {BODY_METRIC_LABELS[metric as BodyMetricMetric]}
                                </TextMalet>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.chartWrap}>
                    <BarChart
                        data={trendData}
                        formatValue={(value) =>
                            trendMetric === 'weight_kg' || trendMetric === 'muscle_mass_kg'
                                ? formatVolume(value)
                                : `${value} %`
                        }
                    />
                </View>
            </View>

            <TextMalet style={styles.sectionTitle}>Historial</TextMalet>
        </View>
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader
                    title="Medidas"
                    subtitle="Peso y composición corporal"
                    right={
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setEditing('new')}
                            activeOpacity={0.7}
                        >
                            <Plus size={18} color="#111" />
                        </TouchableOpacity>
                    }
                />

                <FlashList
                    data={metrics}
                    keyExtractor={keyExtractor}
                    renderItem={renderMetric}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadBodyMetrics({ refresh: false })}
                    onRefresh={() => loadBodyMetrics({ refresh: true })}
                    refreshing={loading && metrics.length === 0}
                    ListFooterComponent={
                        loading && metrics.length > 0 && !pagination.isEnd ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#999" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        loading ? (
                            <SkeletonShimmer style={styles.skeleton}>
                                <SkeletonBlock h={60} r={14} />
                                <SkeletonBlock h={60} r={14} />
                            </SkeletonShimmer>
                        ) : (
                            <TextMalet style={styles.empty}>
                                Aún no registras medidas. Toca “+” para empezar.
                            </TextMalet>
                        )
                    }
                />

                {editing !== null ? (
                    <BodyMetricModal
                        key={editing === 'new' ? 'new' : editing.id}
                        visible
                        metric={editing === 'new' ? null : editing}
                        saving={saving}
                        onClose={() => setEditing(null)}
                        onSubmit={submit}
                    />
                ) : null}
            </View>
        </LayoutAuthenticated>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statCard}>
            <TextMalet style={styles.statLabel}>{label}</TextMalet>
            <TextMalet style={styles.statValue} numberOfLines={1}>
                {value}
            </TextMalet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    header: {
        gap: 12,
        paddingBottom: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    chipActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    chipTextActive: {
        color: '#fff',
    },
    chartWrap: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 11,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    rowLeft: {
        flex: 1,
        gap: 2,
    },
    rowDate: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
        textTransform: 'capitalize',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    rowBmi: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
    footerLoader: {
        paddingVertical: 14,
    },
    skeleton: {
        gap: 8,
    },
    empty: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 18,
    },
});
