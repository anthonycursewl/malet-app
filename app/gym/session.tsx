import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import {
    formatDuration,
    formatVolume,
    formatWeight,
    formatWorkoutDate,
    notify,
} from '@/components/gym/format';
import { notifyUndo } from '@/components/cuaderno/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    GYM_MUSCLE_GROUP_LABELS,
    GYM_SESSION_STATUS_LABELS,
    sessionReps,
    sessionSets,
    sessionVolume,
    setVolume,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Detalle de un entrenamiento registrado (solo lectura). */
export default function GymSessionScreen() {
    const { session: sessionId } = useLocalSearchParams<{ session: string }>();

    const session = useGymStore((s) => s.currentSession);
    const loading = useGymStore((s) => s.sessionLoading);
    const loadSession = useGymStore((s) => s.loadSession);
    const deleteSession = useGymStore((s) => s.deleteSession);
    const restoreSession = useGymStore((s) => s.restoreSession);
    const loadReports = useGymStore((s) => s.loadReports);

    useEffect(() => {
        if (sessionId) void loadSession(sessionId);
    }, [sessionId, loadSession]);

    const confirmDelete = () => {
        if (!session) return;

        Alert.alert(
            'Eliminar entrenamiento',
            'Dejará de contar en tus reportes. Podrás deshacerlo mientras el aviso esté visible.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const error = await deleteSession(session.id);
                        if (error) {
                            notify('error', error);
                            return;
                        }
                        void loadReports();
                        notifyUndo('Entrenamiento eliminado.', async () => {
                            const restoreError = await restoreSession(session.id);
                            if (restoreError) notify('error', restoreError);
                        });
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader
                    title="Entrenamiento"
                    subtitle={session ? formatWorkoutDate(session.date) : undefined}
                />

                {loading && !session ? (
                    <SkeletonShimmer style={styles.skeleton}>
                        <SkeletonBlock h={96} r={16} />
                        <SkeletonBlock h={140} r={16} />
                        <SkeletonBlock h={140} r={16} />
                    </SkeletonShimmer>
                ) : !session ? (
                    <TextMalet style={styles.empty}>Este entrenamiento no está disponible.</TextMalet>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.statsGrid}>
                            <Stat label="Volumen" value={formatVolume(sessionVolume(session))} />
                            <Stat label="Series" value={String(sessionSets(session))} />
                            <Stat label="Reps" value={String(sessionReps(session))} />
                            <Stat label="Duración" value={formatDuration(session.duration_minutes)} />
                        </View>

                        <View style={styles.metaRow}>
                            <TextMalet style={styles.metaChip}>
                                {GYM_SESSION_STATUS_LABELS[session.status]}
                            </TextMalet>
                            {session.rpe != null ? (
                                <TextMalet style={styles.metaChip}>RPE {session.rpe}</TextMalet>
                            ) : null}
                        </View>

                        {session.notes ? (
                            <TextMalet style={styles.notes}>{session.notes}</TextMalet>
                        ) : null}

                        {session.exercises.map((exercise) => (
                            <View key={exercise.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <TextMalet style={styles.exerciseName} numberOfLines={1}>
                                        {exercise.exercise_name}
                                    </TextMalet>
                                    {exercise.muscle_group ? (
                                        <TextMalet style={styles.muscleChip}>
                                            {GYM_MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                                        </TextMalet>
                                    ) : null}
                                </View>

                                <View style={styles.tableHeader}>
                                    <TextMalet style={[styles.colNumber, styles.th]}>#</TextMalet>
                                    <TextMalet style={[styles.colValue, styles.th]}>Reps</TextMalet>
                                    <TextMalet style={[styles.colValue, styles.th]}>Kg</TextMalet>
                                    <TextMalet style={[styles.colValue, styles.th]}>RPE</TextMalet>
                                    <TextMalet style={[styles.colVolume, styles.th]}>Vol.</TextMalet>
                                </View>

                                {exercise.sets.map((set) => (
                                    <View key={set.id} style={styles.setRow}>
                                        <TextMalet style={[styles.colNumber, styles.setIndex]}>
                                            {set.is_warmup ? 'W' : set.set_number}
                                        </TextMalet>
                                        <TextMalet style={[styles.colValue, styles.setValue]}>
                                            {set.reps ?? '—'}
                                        </TextMalet>
                                        <TextMalet style={[styles.colValue, styles.setValue]}>
                                            {set.weight != null ? formatWeight(set.weight) : '—'}
                                        </TextMalet>
                                        <TextMalet style={[styles.colValue, styles.setValue]}>
                                            {set.rpe ?? '—'}
                                        </TextMalet>
                                        <TextMalet style={[styles.colVolume, styles.setValue]}>
                                            {setVolume(set) > 0 ? formatVolume(setVolume(set)) : '—'}
                                        </TextMalet>
                                    </View>
                                ))}
                            </View>
                        ))}

                        <Button
                            text="Eliminar entrenamiento"
                            onPress={confirmDelete}
                            style={styles.dangerBtn}
                            labelStyle={styles.dangerLabel}
                        />
                    </ScrollView>
                )}
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
    empty: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 12,
    },
    scrollContent: {
        gap: 12,
        paddingBottom: 40,
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
    metaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    metaChip: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.55)',
        backgroundColor: '#f4f4f5',
        borderRadius: 10,
        paddingHorizontal: 9,
        paddingVertical: 4,
        overflow: 'hidden',
    },
    notes: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.55)',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 12,
        gap: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    exerciseName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    muscleChip: {
        fontSize: 10.5,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
        backgroundColor: '#f4f4f5',
        borderRadius: 9,
        paddingHorizontal: 8,
        paddingVertical: 3,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    th: {
        fontSize: 9.5,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 3,
    },
    colNumber: {
        width: 24,
        textAlign: 'center',
    },
    colValue: {
        flex: 1,
        textAlign: 'center',
    },
    colVolume: {
        width: 64,
        textAlign: 'right',
    },
    setIndex: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
    },
    setValue: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111',
    },
    dangerBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
        marginTop: 8,
    },
    dangerLabel: {
        color: '#dc2626',
    },
});
