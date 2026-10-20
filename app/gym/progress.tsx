import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import BarChart from '@/components/gym/BarChart';
import {
    formatAdherence,
    formatVolume,
    formatWeight,
} from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    GYM_MUSCLE_GROUP_LABELS,
    GymDatePreset,
    GymMuscleGroup,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

const RANGE_OPTIONS: { value: GymDatePreset; label: string }[] = [
    { value: 'last_7_days', label: '7 días' },
    { value: 'last_30_days', label: '30 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'this_year', label: 'Año' },
];

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Progreso: resumen, volumen, músculos, carga interna, récords y calendario. */
export default function GymProgressScreen() {
    const reportFilters = useGymStore((s) => s.reportFilters);
    const summary = useGymStore((s) => s.summary);
    const volumeSeries = useGymStore((s) => s.volumeSeries);
    const muscleGroups = useGymStore((s) => s.muscleGroups);
    const trainingLoad = useGymStore((s) => s.trainingLoad);
    const records = useGymStore((s) => s.records);
    const calendar = useGymStore((s) => s.calendar);
    const reportsLoading = useGymStore((s) => s.reportsLoading);

    const loadReports = useGymStore((s) => s.loadReports);
    const loadRecords = useGymStore((s) => s.loadRecords);
    const loadCalendar = useGymStore((s) => s.loadCalendar);
    const setReportFilters = useGymStore((s) => s.setReportFilters);

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        void loadReports();
        void loadRecords();
    }, [loadReports, loadRecords]);

    useEffect(() => {
        void loadCalendar({ year, month });
    }, [loadCalendar, year, month]);

    const changeRange = (preset: GymDatePreset) => {
        void setReportFilters({ preset, from: undefined, to: undefined });
    };

    const shiftMonth = (delta: number) => {
        const date = new Date(year, month - 1 + delta, 1);
        setMonth(date.getMonth() + 1);
        setYear(date.getFullYear());
    };

    const volumeData = (volumeSeries?.data ?? []).map((point) => ({
        label: point.bucket.slice(8, 10),
        value: point.volume,
    }));

    const maxMuscleVolume = Math.max(
        1,
        ...(muscleGroups?.data ?? []).map((point) => point.volume)
    );

    const acwr = trainingLoad?.acwr ?? null;
    const acwrStatus =
        acwr == null
            ? 'Sin datos suficientes'
            : acwr < 0.8
              ? 'Carga baja'
              : acwr <= 1.3
                ? 'Zona óptima'
                : acwr <= 1.5
                  ? 'Carga alta'
                  : 'Riesgo alto';

    const calendarDays = calendar?.data ?? [];
    const leadingBlanks = calendarDays.length > 0 ? calendarDays[0].day_of_week - 1 : 0;
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('es-VE', {
        month: 'long',
        year: 'numeric',
    });

    if (reportsLoading && !summary) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    <GymHeader title="Progreso" subtitle="Tu evolución" />
                    <SkeletonShimmer style={styles.skeleton}>
                        <SkeletonBlock h={88} r={16} />
                        <SkeletonBlock h={160} r={16} />
                        <SkeletonBlock h={180} r={16} />
                    </SkeletonShimmer>
                </View>
            </LayoutAuthenticated>
        );
    }

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader title="Progreso" subtitle="Tu evolución" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Rango */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chips}
                    >
                        {RANGE_OPTIONS.map((option) => {
                            const active = (reportFilters.preset ?? 'last_30_days') === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => changeRange(option.value)}
                                    activeOpacity={0.7}
                                >
                                    <TextMalet
                                        style={[styles.chipText, active && styles.chipTextActive]}
                                    >
                                        {option.label}
                                    </TextMalet>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Resumen */}
                    <View style={styles.statsGrid}>
                        <Stat label="Volumen" value={formatVolume(summary?.total_volume ?? 0)} />
                        <Stat label="Entrenos" value={String(summary?.sessions_count ?? 0)} />
                        <Stat label="Series" value={String(summary?.total_sets ?? 0)} />
                        <Stat label="Adherencia" value={formatAdherence(summary?.adherence)} />
                    </View>

                    {/* Volumen por día */}
                    <View style={styles.card}>
                        <TextMalet style={styles.cardTitle}>Volumen por día</TextMalet>
                        <TextMalet style={styles.cardHint}>
                            Peso total movido (kg) en cada día del rango.
                        </TextMalet>
                        <View style={styles.chartWrap}>
                            <BarChart data={volumeData} formatValue={formatVolume} />
                        </View>
                    </View>

                    {/* Grupos musculares */}
                    <View style={styles.card}>
                        <TextMalet style={styles.cardTitle}>Por grupo muscular</TextMalet>
                        <TextMalet style={styles.cardHint}>
                            Reparte el volumen para detectar desbalances.
                        </TextMalet>

                        {(muscleGroups?.data ?? []).length === 0 ? (
                            <TextMalet style={styles.cardHint}>Sin datos en este rango.</TextMalet>
                        ) : (
                            (muscleGroups?.data ?? []).map((point) => {
                                const label =
                                    point.muscle_group &&
                                    point.muscle_group in GYM_MUSCLE_GROUP_LABELS
                                        ? GYM_MUSCLE_GROUP_LABELS[
                                              point.muscle_group as GymMuscleGroup
                                          ]
                                        : point.muscle_group ?? 'Otro';

                                return (
                                    <View key={point.muscle_group ?? 'none'} style={styles.muscleRow}>
                                        <TextMalet style={styles.muscleLabel} numberOfLines={1}>
                                            {label}
                                        </TextMalet>
                                        <View style={styles.muscleTrack}>
                                            <View
                                                style={[
                                                    styles.muscleBar,
                                                    {
                                                        width: `${Math.max(
                                                            4,
                                                            (point.volume / maxMuscleVolume) * 100
                                                        )}%`,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <TextMalet style={styles.muscleValue}>
                                            {formatVolume(point.volume)}
                                        </TextMalet>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Carga interna */}
                    <View style={styles.card}>
                        <TextMalet style={styles.cardTitle}>Carga interna (sRPE)</TextMalet>
                        <View style={styles.loadRow}>
                            <View style={styles.loadBlock}>
                                <TextMalet style={styles.loadValue}>
                                    {acwr != null ? acwr.toFixed(2) : '—'}
                                </TextMalet>
                                <TextMalet style={styles.loadLabel}>ACWR</TextMalet>
                            </View>
                            <View style={styles.loadTexts}>
                                <TextMalet style={styles.loadStatus}>{acwrStatus}</TextMalet>
                                <TextMalet style={styles.cardHint}>
                                    Aguda 7d: {Math.round(trainingLoad?.acute_7d ?? 0)} · Crónica
                                    28d/sem: {Math.round(trainingLoad?.chronic_28d_weekly_avg ?? 0)}
                                </TextMalet>
                                <TextMalet style={styles.cardHint}>
                                    Ratio agudo:crónico entre 0.8 y 1.3 = zona óptima.
                                </TextMalet>
                            </View>
                        </View>
                    </View>

                    {/* Récords */}
                    <View style={styles.card}>
                        <TextMalet style={styles.cardTitle}>Récords personales</TextMalet>
                        {records.length === 0 ? (
                            <TextMalet style={styles.cardHint}>
                                Registra entrenamientos para ver tus PRs.
                            </TextMalet>
                        ) : (
                            records.slice(0, 5).map((record) => (
                                <View
                                    key={`${record.exercise_id ?? record.exercise_name}`}
                                    style={styles.recordRow}
                                >
                                    <View style={styles.recordTexts}>
                                        <TextMalet style={styles.recordName} numberOfLines={1}>
                                            {record.exercise_name}
                                        </TextMalet>
                                        <TextMalet style={styles.recordSub}>
                                            {record.max_weight_reps ?? 0} reps · 1RM est.{' '}
                                            {formatWeight(record.estimated_1rm)}
                                        </TextMalet>
                                    </View>
                                    <TextMalet style={styles.recordValue}>
                                        {formatWeight(record.max_weight)}
                                    </TextMalet>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Calendario */}
                    <View style={styles.card}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity
                                onPress={() => shiftMonth(-1)}
                                style={styles.monthBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft size={16} color="#111" />
                            </TouchableOpacity>
                            <TextMalet style={styles.monthLabel}>{monthLabel}</TextMalet>
                            <TouchableOpacity
                                onPress={() => shiftMonth(1)}
                                style={styles.monthBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronRight size={16} color="#111" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekRow}>
                            {WEEK_LABELS.map((label, index) => (
                                <TextMalet key={`${label}-${index}`} style={styles.weekLabel}>
                                    {label}
                                </TextMalet>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {Array.from({ length: leadingBlanks }).map((_, index) => (
                                <View key={`blank-${index}`} style={styles.dayCell} />
                            ))}

                            {calendarDays.map((day) => (
                                <View key={day.date} style={styles.dayCell}>
                                    <View
                                        style={[
                                            styles.dayDot,
                                            day.planned && styles.dayPlanned,
                                            day.completed && styles.dayCompleted,
                                        ]}
                                    >
                                        <TextMalet
                                            style={[
                                                styles.dayNumber,
                                                day.completed && styles.dayNumberDone,
                                            ]}
                                        >
                                            {Number(day.date.slice(8, 10))}
                                        </TextMalet>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.legend}>
                            <View style={[styles.legendDot, styles.dayPlanned]} />
                            <TextMalet style={styles.legendText}>Planificado</TextMalet>
                            <View style={[styles.legendDot, styles.dayCompleted]} />
                            <TextMalet style={styles.legendText}>Completado</TextMalet>
                        </View>
                    </View>

                    <View style={{ height: 24 }} />
                </ScrollView>
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
    skeleton: {
        gap: 12,
    },
    scrollContent: {
        gap: 12,
        paddingBottom: 40,
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
        gap: 4,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    cardHint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 16,
    },
    chartWrap: {
        marginTop: 10,
    },
    muscleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    muscleLabel: {
        width: 74,
        fontSize: 11.5,
        fontWeight: '600',
        color: '#333',
    },
    muscleTrack: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    muscleBar: {
        height: '100%',
        backgroundColor: '#111',
        borderRadius: 5,
    },
    muscleValue: {
        width: 68,
        fontSize: 10.5,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'right',
    },
    loadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8,
    },
    loadBlock: {
        alignItems: 'center',
        backgroundColor: '#f4f4f5',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    loadValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.4,
    },
    loadLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.4)',
        letterSpacing: 0.6,
    },
    loadTexts: {
        flex: 1,
        gap: 2,
    },
    loadStatus: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: 4,
    },
    recordTexts: {
        flex: 1,
        gap: 1,
    },
    recordName: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111',
    },
    recordSub: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.45)',
    },
    recordValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    monthBtn: {
        padding: 6,
        borderRadius: 10,
        backgroundColor: '#f4f4f5',
    },
    monthLabel: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
        textTransform: 'capitalize',
    },
    weekRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    weekLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.35)',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    dayCell: {
        width: `${100 / 7}%`,
        alignItems: 'center',
        paddingVertical: 3,
    },
    dayDot: {
        width: 28,
        height: 28,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayPlanned: {
        borderColor: 'rgba(0,0,0,0.25)',
    },
    dayCompleted: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    dayNumber: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
    },
    dayNumberDone: {
        color: '#fff',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.45)',
        marginRight: 8,
    },
});
