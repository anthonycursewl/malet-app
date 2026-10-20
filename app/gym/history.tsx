import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import { formatDuration, formatVolume, formatWorkoutDate } from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    GYM_SESSION_STATUS_LABELS,
    GymDatePreset,
    GymSession,
    sessionReps,
    sessionSets,
    sessionVolume,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

const RANGE_OPTIONS: { value: GymDatePreset | null; label: string }[] = [
    { value: null, label: 'Todo' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_7_days', label: '7 días' },
    { value: 'last_30_days', label: '30 días' },
    { value: 'this_year', label: 'Año' },
];

/** Historial de entrenamientos con filtro por rango y paginación por cursor. */
export default function GymHistoryScreen() {
    const sessions = useGymStore((s) => s.sessions);
    const loading = useGymStore((s) => s.sessionsLoading);
    const pagination = useGymStore((s) => s.sessionsPagination);
    const filters = useGymStore((s) => s.sessionFilters);
    const loadSessions = useGymStore((s) => s.loadSessions);
    const setSessionFilters = useGymStore((s) => s.setSessionFilters);

    useEffect(() => {
        void loadSessions({ refresh: true });
    }, [loadSessions]);

    const chooseRange = (preset: GymDatePreset | null) => {
        void setSessionFilters({ preset, from: null, to: null });
    };

    const renderSession = useCallback(
        ({ item }: { item: GymSession }) => {
            const exercises = item.exercises.length;
            const sets = sessionSets(item);

            return (
                <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() =>
                        router.push({
                            pathname: '/gym/session',
                            params: { session: item.id },
                        } as any)
                    }
                >
                    <View style={styles.rowLeft}>
                        <TextMalet style={styles.rowDate}>
                            {formatWorkoutDate(item.date)}
                        </TextMalet>
                        <TextMalet style={styles.rowSub} numberOfLines={1}>
                            {GYM_SESSION_STATUS_LABELS[item.status]} · {exercises}{' '}
                            {exercises === 1 ? 'ejercicio' : 'ejercicios'} · {sets} series
                            {item.duration_minutes
                                ? ` · ${formatDuration(item.duration_minutes)}`
                                : ''}
                        </TextMalet>
                    </View>

                    <View style={styles.rowRight}>
                        <TextMalet style={styles.rowVolume}>
                            {formatVolume(sessionVolume(item))}
                        </TextMalet>
                        <TextMalet style={styles.rowReps}>{sessionReps(item)} reps</TextMalet>
                    </View>
                </TouchableOpacity>
            );
        },
        []
    );

    const keyExtractor = useCallback((item: GymSession) => item.id, []);

    const header = (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
        >
            {RANGE_OPTIONS.map((option) => {
                const active = (filters.preset ?? null) === option.value;
                return (
                    <TouchableOpacity
                        key={option.label}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => chooseRange(option.value)}
                        activeOpacity={0.7}
                    >
                        <TextMalet style={[styles.chipText, active && styles.chipTextActive]}>
                            {option.label}
                        </TextMalet>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader title="Historial" subtitle="Tus entrenamientos" />

                <FlashList
                    data={sessions}
                    keyExtractor={keyExtractor}
                    renderItem={renderSession}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadSessions({ refresh: false })}
                    onRefresh={() => loadSessions({ refresh: true })}
                    refreshing={loading && sessions.length === 0}
                    ListFooterComponent={
                        loading && sessions.length > 0 && !pagination.isEnd ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#999" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        loading ? (
                            <SkeletonShimmer style={styles.skeleton}>
                                <SkeletonBlock h={62} r={14} />
                                <SkeletonBlock h={62} r={14} />
                                <SkeletonBlock h={62} r={14} />
                            </SkeletonShimmer>
                        ) : (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>Sin entrenamientos</TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    Cuando registres uno aparecerá aquí con su volumen y duración.
                                </TextMalet>
                            </View>
                        )
                    }
                />
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    listContent: {
        paddingBottom: 40,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 12,
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
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    rowRight: {
        alignItems: 'flex-end',
        gap: 1,
    },
    rowVolume: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
    rowReps: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.4)',
    },
    footerLoader: {
        paddingVertical: 14,
    },
    skeleton: {
        gap: 8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        gap: 6,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
    },
});
