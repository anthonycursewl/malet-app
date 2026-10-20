import { router, useLocalSearchParams } from 'expo-router';
import { Check, Plus, Timer, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import { notify, parseNumberInput } from '@/components/gym/format';
import {
    GYM_MUSCLE_GROUP_LABELS,
    GymMuscleGroup,
    GymSession,
    GymSessionInput,
    todayWorkoutDate,
} from '@/shared/entities/Gym';
import { gymService } from '@/shared/services/gym/gym.service';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Serie en edición: los numéricos viven como texto hasta guardar. */
interface DraftSet {
    reps: string;
    weight: string;
    rpe: string;
    is_warmup: boolean;
    completed: boolean;
    duration: string;
    distance: string;
}

interface DraftExercise {
    exercise_id: string | null;
    exercise_name: string;
    muscle_group: GymMuscleGroup | null;
    sets: DraftSet[];
}

interface Draft {
    exercises: DraftExercise[];
}

const emptySet = (): DraftSet => ({
    reps: '',
    weight: '',
    rpe: '',
    is_warmup: false,
    completed: false,
    duration: '',
    distance: '',
});

/** Convierte la sesión (precargada por el backend) en el borrador editable. */
function draftFromSession(session: GymSession): Draft {
    return {
        exercises: (session.exercises ?? []).map((exercise) => ({
            exercise_id: exercise.exercise_id,
            exercise_name: exercise.exercise_name,
            muscle_group: exercise.muscle_group,
            sets:
                exercise.sets.length > 0
                    ? exercise.sets.map((set) => ({
                          reps: set.reps != null ? String(set.reps) : '',
                          weight: set.weight != null ? String(set.weight) : '',
                          rpe: set.rpe != null ? String(set.rpe) : '',
                          is_warmup: set.is_warmup,
                          completed: set.completed,
                          duration:
                              set.duration_seconds != null
                                  ? String(set.duration_seconds)
                                  : '',
                          distance:
                              set.distance_meters != null
                                  ? String(set.distance_meters)
                                  : '',
                      }))
                    : [emptySet()],
        })),
    };
}

function formatElapsed(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Registro de un entrenamiento: arranca desde el día de la rutina (el backend
 * precarga las series con los objetivos) y guarda todo al finalizar.
 */
export default function GymWorkoutScreen() {
    const { day, session: sessionId } = useLocalSearchParams<{
        day?: string;
        session?: string;
    }>();

    const loadSessions = useGymStore((s) => s.loadSessions);
    const loadActiveRoutine = useGymStore((s) => s.loadActiveRoutine);

    const [session, setSession] = useState<GymSession | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rpe, setRpe] = useState<number | null>(null);
    const [notes, setNotes] = useState('');

    const startedAt = useRef(0);
    const [elapsed, setElapsed] = useState(0);

    /** Descanso entre series: segundos restantes y plan del día. */
    const [restSeconds, setRestSeconds] = useState<number | null>(null);
    const [restByExercise, setRestByExercise] = useState<Record<string, number>>({});
    const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // El cronómetro arranca al montar la pantalla.
    useEffect(() => {
        startedAt.current = Date.now();
    }, []);

    // Arranca la sesión (o carga una existente) una sola vez.
    useEffect(() => {
        let active = true;

        const start = async () => {
            if (sessionId) {
                const res = await gymService.getSession(sessionId);
                if (!active) return;
                if (res.error || !res.response) {
                    notify('error', res.error ?? 'No se pudo abrir el entrenamiento.');
                    setLoading(false);
                    return;
                }
                setSession(res.response);
                setDraft(draftFromSession(res.response));
                setRpe(res.response.rpe ?? null);
                setNotes(res.response.notes ?? '');
                setLoading(false);
                return;
            }

            if (!day) {
                setLoading(false);
                return;
            }

            const res = await gymService.createSession({
                routine_day_id: day,
                date: todayWorkoutDate(),
                status: 'in_progress',
            });
            if (!active) return;

            if (res.error || !res.response) {
                notify('error', res.error ?? 'No se pudo iniciar el entrenamiento.');
                setLoading(false);
                return;
            }

            setSession(res.response);
            setDraft(draftFromSession(res.response));
            setLoading(false);
        };

        void start();
        return () => {
            active = false;
        };
    }, [day, sessionId]);

    // Cronómetro del entrenamiento.
    useEffect(() => {
        if (!session) return;
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [session]);

    // Descanso planificado por ejercicio (el día de la rutina lo define).
    useEffect(() => {
        if (!session?.routine_id || !session.routine_day_id) return;

        let active = true;
        const load = async () => {
            const { error, response } = await gymService.getRoutineWeek(
                session.routine_id as string
            );
            if (!active || error || !response) return;

            const day = response.days.find((item) => item.id === session.routine_day_id);
            if (!day) return;

            const map: Record<string, number> = {};
            day.exercises.forEach((exercise) => {
                if (exercise.rest_seconds) map[exercise.exercise_id] = exercise.rest_seconds;
            });
            setRestByExercise(map);
        };

        void load();
        return () => {
            active = false;
        };
    }, [session?.routine_id, session?.routine_day_id]);

    // Limpieza del temporizador al salir.
    useEffect(
        () => () => {
            if (restRef.current) clearInterval(restRef.current);
        },
        []
    );

    const startRest = (seconds: number) => {
        if (restRef.current) clearInterval(restRef.current);
        setRestSeconds(seconds);

        restRef.current = setInterval(() => {
            setRestSeconds((prev) => {
                if (prev == null) return null;
                if (prev <= 1) {
                    if (restRef.current) clearInterval(restRef.current);
                    restRef.current = null;
                    notify('info', '¡A por la siguiente serie!');
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopRest = () => {
        if (restRef.current) clearInterval(restRef.current);
        restRef.current = null;
        setRestSeconds(null);
    };

    const updateExercise = (
        exerciseIndex: number,
        update: (exercise: DraftExercise) => DraftExercise
    ) =>
        setDraft((prev) =>
            prev
                ? {
                      exercises: prev.exercises.map((exercise, index) =>
                          index === exerciseIndex ? update(exercise) : exercise
                      ),
                  }
                : prev
        );

    const updateSet = (
        exerciseIndex: number,
        setIndex: number,
        patch: Partial<DraftSet>
    ) =>
        updateExercise(exerciseIndex, (exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set, index) =>
                index === setIndex ? { ...set, ...patch } : set
            ),
        }));

    const addSet = (exerciseIndex: number) =>
        updateExercise(exerciseIndex, (exercise) => {
            const last = exercise.sets[exercise.sets.length - 1];
            return {
                ...exercise,
                sets: [
                    ...exercise.sets,
                    {
                        ...emptySet(),
                        // Arrastra reps/peso de la serie anterior para ir rápido.
                        reps: last?.reps ?? '',
                        weight: last?.weight ?? '',
                    },
                ],
            };
        });

    const removeSet = (exerciseIndex: number, setIndex: number) =>
        updateExercise(exerciseIndex, (exercise) => ({
            ...exercise,
            sets: exercise.sets.filter((_, index) => index !== setIndex),
        }));

    /** Marca/desmarca una serie; al completarla arranca el descanso planificado. */
    const completeSet = (exerciseIndex: number, setIndex: number) => {
        if (!draft) return;

        const set = draft.exercises[exerciseIndex]?.sets[setIndex];
        if (!set) return;

        const next = !set.completed;
        updateSet(exerciseIndex, setIndex, { completed: next });

        if (!next) return;

        const exerciseId = draft.exercises[exerciseIndex].exercise_id;
        const rest = exerciseId ? restByExercise[exerciseId] : undefined;
        if (rest && rest > 0) startRest(rest);
    };

    /** Payload final: se descartan las series sin reps ni duración. */
    const buildExercises = (source: Draft): GymSessionInput['exercises'] =>
        source.exercises.map((exercise) => ({
            ...(exercise.exercise_id
                ? { exercise_id: exercise.exercise_id }
                : {
                      exercise_name: exercise.exercise_name,
                      ...(exercise.muscle_group
                          ? { muscle_group: exercise.muscle_group }
                          : {}),
                  }),
            sets: exercise.sets
                .map((set, index) => ({
                    set_number: index + 1,
                    reps: parseNumberInput(set.reps) ?? undefined,
                    weight: parseNumberInput(set.weight) ?? undefined,
                    rpe: parseNumberInput(set.rpe) ?? undefined,
                    is_warmup: set.is_warmup,
                    completed: set.completed,
                    duration_seconds: parseNumberInput(set.duration) ?? undefined,
                    distance_meters: parseNumberInput(set.distance) ?? undefined,
                }))
                .filter(
                    (set) =>
                        set.reps != null || set.duration_seconds != null
                ),
        }));

    const finish = async () => {
        if (!session || !draft) return;

        const exercises = buildExercises(draft) ?? [];
        const completed = exercises.reduce(
            (total, exercise) =>
                total + (exercise.sets ?? []).filter((set) => set.completed).length,
            0
        );

        if (completed === 0) {
            notify('error', 'Marca al menos una serie como completada.');
            return;
        }

        setSaving(true);
        const { error } = await gymService.updateSession(session.id, {
            status: 'completed',
            duration_minutes: Math.max(1, Math.round(elapsed / 60)),
            ...(rpe != null ? { rpe } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
            exercises,
        });
        setSaving(false);

        if (error) {
            notify('error', error);
            return;
        }

        notify('success', '¡Entrenamiento guardado!');
        void loadSessions({ refresh: true });
        void loadActiveRoutine();
        router.back();
    };

    if (loading) {
        return (
            <LayoutAuthenticated>
                <View style={styles.loading}>
                    <ActivityIndicator size="small" color="#111" />
                    <TextMalet style={styles.loadingText}>Preparando tu entrenamiento…</TextMalet>
                </View>
            </LayoutAuthenticated>
        );
    }

    if (!session || !draft) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    <GymHeader title="Entrenar" />
                    <TextMalet style={styles.emptyText}>
                        No hay un entrenamiento para mostrar.
                    </TextMalet>
                </View>
            </LayoutAuthenticated>
        );
    }

    const completedSets = draft.exercises.reduce(
        (total, exercise) =>
            total + exercise.sets.filter((set) => set.completed).length,
        0
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader
                    title="Entrenando"
                    subtitle={`${draft.exercises.length} ${
                        draft.exercises.length === 1 ? 'ejercicio' : 'ejercicios'
                    } · ${completedSets} ${
                        completedSets === 1 ? 'serie hecha' : 'series hechas'
                    }`}
                    right={
                        <View style={styles.timer}>
                            <Timer size={14} color="#111" />
                            <TextMalet style={styles.timerText}>
                                {formatElapsed(elapsed)}
                            </TextMalet>
                        </View>
                    }
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {draft.exercises.map((exercise, exerciseIndex) => {
                        const isCardio = exercise.muscle_group === 'cardio';

                        return (
                            <View key={`${exercise.exercise_name}-${exerciseIndex}`} style={styles.card}>
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
                                    <TextMalet style={[styles.colInput, styles.th]}>
                                        {isCardio ? 'Seg' : 'Reps'}
                                    </TextMalet>
                                    <TextMalet style={[styles.colInput, styles.th]}>
                                        {isCardio ? 'Metros' : 'Kg'}
                                    </TextMalet>
                                    {!isCardio && (
                                        <TextMalet style={[styles.colInput, styles.th]}>RPE</TextMalet>
                                    )}
                                    <TextMalet style={[styles.colDone, styles.th]}>✓</TextMalet>
                                </View>

                                {exercise.sets.map((set, setIndex) => (
                                    <View
                                        key={setIndex}
                                        style={[styles.setRow, set.completed && styles.setRowDone]}
                                    >
                                        <TouchableOpacity
                                            style={styles.colNumber}
                                            onLongPress={() =>
                                                updateSet(exerciseIndex, setIndex, {
                                                    is_warmup: !set.is_warmup,
                                                })
                                            }
                                            activeOpacity={0.7}
                                        >
                                            <TextMalet
                                                style={[
                                                    styles.setNumber,
                                                    set.is_warmup && styles.setNumberWarmup,
                                                ]}
                                            >
                                                {set.is_warmup ? 'W' : setIndex + 1}
                                            </TextMalet>
                                        </TouchableOpacity>

                                        <TextInput
                                            style={styles.colInput}
                                            value={isCardio ? set.duration : set.reps}
                                            onChangeText={(value) =>
                                                updateSet(
                                                    exerciseIndex,
                                                    setIndex,
                                                    isCardio ? { duration: value } : { reps: value }
                                                )
                                            }
                                            keyboardType="number-pad"
                                            placeholder="—"
                                            placeholderTextColor="rgba(0,0,0,0.25)"
                                        />

                                        <TextInput
                                            style={styles.colInput}
                                            value={isCardio ? set.distance : set.weight}
                                            onChangeText={(value) =>
                                                updateSet(
                                                    exerciseIndex,
                                                    setIndex,
                                                    isCardio ? { distance: value } : { weight: value }
                                                )
                                            }
                                            keyboardType="decimal-pad"
                                            placeholder="—"
                                            placeholderTextColor="rgba(0,0,0,0.25)"
                                        />

                                        {!isCardio && (
                                            <TextInput
                                                style={styles.colInput}
                                                value={set.rpe}
                                                onChangeText={(value) =>
                                                    updateSet(exerciseIndex, setIndex, { rpe: value })
                                                }
                                                keyboardType="number-pad"
                                                placeholder="—"
                                                placeholderTextColor="rgba(0,0,0,0.25)"
                                            />
                                        )}

                                        <View style={styles.colDone}>
                                            <TouchableOpacity
                                                onPress={() => completeSet(exerciseIndex, setIndex)}
                                                onLongPress={() => removeSet(exerciseIndex, setIndex)}
                                                activeOpacity={0.7}
                                                style={[styles.check, set.completed && styles.checkActive]}
                                            >
                                                {set.completed && <Check size={14} color="#fff" />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    style={styles.addSet}
                                    onPress={() => addSet(exerciseIndex)}
                                    activeOpacity={0.7}
                                >
                                    <Plus size={14} color="#111" />
                                    <TextMalet style={styles.addSetText}>Añadir serie</TextMalet>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {/* Cierre del entrenamiento */}
                    <View style={styles.card}>
                        <TextMalet style={styles.cardTitle}>¿Cómo fue?</TextMalet>
                        <TextMalet style={styles.cardHint}>Esfuerzo percibido (1 – 10)</TextMalet>
                        <View style={styles.rpeRow}>
                            {[6, 7, 8, 9, 10].map((value) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.rpeChip, rpe === value && styles.rpeChipActive]}
                                    onPress={() => setRpe(rpe === value ? null : value)}
                                    activeOpacity={0.7}
                                >
                                    <TextMalet
                                        style={[styles.rpeText, rpe === value && styles.rpeTextActive]}
                                    >
                                        {value}
                                    </TextMalet>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.notesInput}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Notas del entrenamiento (opcional)"
                            placeholderTextColor="rgba(0,0,0,0.3)"
                            multiline
                        />
                    </View>

                    <View style={{ height: 90 }} />
                </ScrollView>

                {/* Descanso entre series */}
                {restSeconds != null ? (
                    <View style={styles.restBanner}>
                        <TextMalet style={styles.restBannerLabel}>Descanso</TextMalet>
                        <TextMalet style={styles.restBannerTime}>
                            {formatElapsed(restSeconds)}
                        </TextMalet>
                        <TouchableOpacity
                            style={styles.restAction}
                            onPress={() => setRestSeconds((prev) => (prev ?? 0) + 15)}
                            activeOpacity={0.7}
                        >
                            <TextMalet style={styles.restActionText}>+15 s</TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.restAction}
                            onPress={stopRest}
                            activeOpacity={0.7}
                        >
                            <TextMalet style={styles.restActionText}>Saltar</TextMalet>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Acción fija */}
                <View style={styles.footer}>
                    <Button
                        text="Finalizar entrenamiento"
                        onPress={finish}
                        loading={saving}
                        style={styles.finishBtn}
                    />
                </View>

                <TouchableOpacity
                    style={styles.discard}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Trash2 size={13} color="rgba(0,0,0,0.4)" />
                </TouchableOpacity>
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
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
    },
    emptyText: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 12,
    },
    scrollContent: {
        gap: 12,
        paddingBottom: 120,
    },
    timer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f4f4f5',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    timerText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#111',
        fontVariant: ['tabular-nums'],
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
        marginTop: 4,
    },
    th: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2,
    },
    setRowDone: {
        opacity: 0.9,
    },
    colNumber: {
        width: 26,
        alignItems: 'center',
    },
    colInput: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 4,
    },
    colDone: {
        width: 30,
        alignItems: 'center',
    },
    setNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
    },
    setNumberWarmup: {
        color: '#b45309',
    },
    check: {
        width: 26,
        height: 26,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    addSet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingVertical: 4,
    },
    addSetText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    cardHint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
    },
    rpeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    rpeChip: {
        width: 38,
        height: 34,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },
    rpeChipActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    rpeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    rpeTextActive: {
        color: '#fff',
    },
    notesInput: {
        marginTop: 10,
        minHeight: 64,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 12,
        padding: 10,
        fontSize: 13,
        color: '#111',
        textAlignVertical: 'top',
    },
    footer: {
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 18,
    },
    restBanner: {
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 78,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#111',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    restBannerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    restBannerTime: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.3,
    },
    restAction: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    restActionText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#fff',
    },
    finishBtn: {
        width: '100%',
    },
    discard: {
        position: 'absolute',
        top: 4,
        right: 4,
        padding: 8,
    },
});
