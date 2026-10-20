import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import RoutineDayModal from '@/components/gym/RoutineDayModal';
import { notify } from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    DAY_LABELS,
    GymRoutineDayInput,
    GymWeekDay,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Detalle de una rutina: grid semanal editable + activar/eliminar. */
export default function GymRoutineScreen() {
    const { routine: routineId } = useLocalSearchParams<{ routine: string }>();

    const routine = useGymStore((s) => s.currentRoutine);
    const week = useGymStore((s) => s.currentWeek);
    const loading = useGymStore((s) => s.routineLoading);
    const loadRoutine = useGymStore((s) => s.loadRoutine);
    const activateRoutine = useGymStore((s) => s.activateRoutine);
    const deactivateRoutine = useGymStore((s) => s.deactivateRoutine);
    const deleteRoutine = useGymStore((s) => s.deleteRoutine);
    const setRoutineDay = useGymStore((s) => s.setRoutineDay);

    const [editingDay, setEditingDay] = useState<GymWeekDay | null>(null);
    const [savingDay, setSavingDay] = useState(false);

    useEffect(() => {
        if (routineId) void loadRoutine(routineId);
    }, [routineId, loadRoutine]);

    const saveDay = async (
        dayOfWeek: number,
        body: GymRoutineDayInput
    ): Promise<string | null> => {
        if (!routineId) return 'No hay una rutina abierta.';

        setSavingDay(true);
        const error = await setRoutineDay(routineId, dayOfWeek, body);
        setSavingDay(false);
        if (!error) notify('success', 'Día guardado.');
        return error;
    };

    const toggleActive = async () => {
        if (!routine) return;

        const error = routine.is_active
            ? await deactivateRoutine(routine.id)
            : await activateRoutine(routine.id);

        if (error) notify('error', error);
        else notify('success', routine.is_active ? 'Rutina desactivada.' : 'Rutina activada.');
    };

    const confirmDelete = () => {
        if (!routine) return;

        Alert.alert(
            'Eliminar rutina',
            `"${routine.name}" dejará de estar disponible. El historial se conserva.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const error = await deleteRoutine(routine.id);
                        if (error) {
                            notify('error', error);
                            return;
                        }
                        notify('success', 'Rutina eliminada.');
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
                    title={routine?.name ?? 'Rutina'}
                    subtitle={routine?.is_active ? 'Activa' : 'Sin activar'}
                />

                {loading && !routine ? (
                    <SkeletonShimmer style={styles.skeleton}>
                        <SkeletonBlock h={56} r={14} />
                        <SkeletonBlock h={56} r={14} />
                        <SkeletonBlock h={56} r={14} />
                    </SkeletonShimmer>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {routine?.description ? (
                            <TextMalet style={styles.description}>{routine.description}</TextMalet>
                        ) : null}

                        <TextMalet style={styles.sectionTitle}>Semana</TextMalet>

                        {(week?.days ?? []).map((day) => {
                            const isRest = day.is_rest;
                            const count = day.exercises.length;

                            return (
                                <TouchableOpacity
                                    key={day.day_of_week}
                                    style={styles.dayRow}
                                    activeOpacity={0.7}
                                    onPress={() => setEditingDay(day)}
                                >
                                    <View style={styles.dayBadge}>
                                        <TextMalet style={styles.dayBadgeText}>
                                            {DAY_LABELS[day.day_of_week].slice(0, 3)}
                                        </TextMalet>
                                    </View>

                                    <View style={styles.dayTexts}>
                                        <TextMalet style={styles.dayTitle} numberOfLines={1}>
                                            {isRest
                                                ? 'Descanso'
                                                : day.title ?? 'Sin título'}
                                        </TextMalet>
                                        <TextMalet style={styles.daySub} numberOfLines={1}>
                                            {isRest
                                                ? 'Sin ejercicios'
                                                : count === 0
                                                  ? 'Sin ejercicios todavía'
                                                  : `${count} ${
                                                        count === 1 ? 'ejercicio' : 'ejercicios'
                                                    }`}
                                        </TextMalet>
                                    </View>

                                    <TextMalet style={styles.chevron}>›</TextMalet>
                                </TouchableOpacity>
                            );
                        })}

                        <View style={styles.actions}>
                            <Button
                                text={routine?.is_active ? 'Desactivar rutina' : 'Activar rutina'}
                                onPress={toggleActive}
                                style={styles.actionBtn}
                            />
                            <Button
                                text="Eliminar rutina"
                                onPress={confirmDelete}
                                style={[styles.actionBtn, styles.dangerBtn]}
                                labelStyle={styles.dangerLabel}
                            />
                        </View>
                    </ScrollView>
                )}

                {editingDay ? (
                    <RoutineDayModal
                        key={editingDay.day_of_week}
                        visible
                        day={editingDay}
                        saving={savingDay}
                        onClose={() => setEditingDay(null)}
                        onSubmit={saveDay}
                    />
                ) : null}
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
    skeleton: {
        gap: 8,
    },
    scrollContent: {
        gap: 10,
        paddingBottom: 40,
    },
    description: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.5)',
        lineHeight: 19,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dayBadge: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#333',
        textTransform: 'uppercase',
    },
    dayTexts: {
        flex: 1,
        gap: 2,
    },
    dayTitle: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
    daySub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    chevron: {
        fontSize: 20,
        color: 'rgba(0,0,0,0.25)',
        fontWeight: '600',
    },
    actions: {
        gap: 10,
        marginTop: 14,
    },
    actionBtn: {
        width: '100%',
    },
    dangerBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
    },
    dangerLabel: {
        color: '#dc2626',
    },
});
