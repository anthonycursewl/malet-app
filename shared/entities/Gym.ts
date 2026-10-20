/**
 * Entidades del módulo Gym (módulo opcional, `gym`).
 * Contrato API: `/gym/...` con Bearer JWT y el módulo activado.
 */

import { SalesDatePreset } from './SalesModule';

/** Presets de rango de fechas: el backend reutiliza los del contrato de ventas. */
export type GymDatePreset = SalesDatePreset;

export const GYM_MODULE_KEY = 'gym';

// ---------------------------------------------------------------------------
// Catálogo del dominio
// ---------------------------------------------------------------------------

export const GYM_MUSCLE_GROUPS = [
    'chest',
    'back',
    'legs',
    'glutes',
    'shoulders',
    'biceps',
    'triceps',
    'core',
    'cardio',
    'mobility',
] as const;
export type GymMuscleGroup = (typeof GYM_MUSCLE_GROUPS)[number];

export const GYM_MUSCLE_GROUP_LABELS: Record<GymMuscleGroup, string> = {
    chest: 'Pecho',
    back: 'Espalda',
    legs: 'Piernas',
    glutes: 'Glúteos',
    shoulders: 'Hombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    core: 'Core',
    cardio: 'Cardio',
    mobility: 'Movilidad',
};

export const GYM_EQUIPMENT = [
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'bodyweight',
    'kettlebell',
    'band',
    'cardio_machine',
    'other',
] as const;
export type GymEquipment = (typeof GYM_EQUIPMENT)[number];

export const GYM_EQUIPMENT_LABELS: Record<GymEquipment, string> = {
    barbell: 'Barra',
    dumbbell: 'Mancuernas',
    machine: 'Máquina',
    cable: 'Polea',
    bodyweight: 'Peso corporal',
    kettlebell: 'Kettlebell',
    band: 'Banda',
    cardio_machine: 'Cardio',
    other: 'Otro',
};

export const GYM_EXERCISE_TYPES = ['strength', 'cardio', 'mobility'] as const;
export type GymExerciseType = (typeof GYM_EXERCISE_TYPES)[number];

export const GYM_EXERCISE_TYPE_LABELS: Record<GymExerciseType, string> = {
    strength: 'Fuerza',
    cardio: 'Cardio',
    mobility: 'Movilidad',
};

export const GYM_SESSION_STATUSES = [
    'in_progress',
    'completed',
    'skipped',
] as const;
export type GymSessionStatus = (typeof GYM_SESSION_STATUSES)[number];

export const GYM_SESSION_STATUS_LABELS: Record<GymSessionStatus, string> = {
    in_progress: 'En progreso',
    completed: 'Completado',
    skipped: 'Omitido',
};

/** ISO days of week: 1 = Monday ... 7 = Sunday. */
export const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
    1: 'Lun',
    2: 'Mar',
    3: 'Mié',
    4: 'Jue',
    5: 'Vie',
    6: 'Sáb',
    7: 'Dom',
};

export const GYM_VOLUME_PERIODS = ['day', 'week', 'month'] as const;
export type GymVolumePeriod = (typeof GYM_VOLUME_PERIODS)[number];

export const BODY_METRIC_TRENDS = [
    'weight_kg',
    'body_fat_pct',
    'muscle_mass_kg',
] as const;
export type BodyMetricMetric = (typeof BODY_METRIC_TRENDS)[number];

export const BODY_METRIC_LABELS: Record<BodyMetricMetric, string> = {
    weight_kg: 'Peso',
    body_fat_pct: 'Grasa corporal',
    muscle_mass_kg: 'Masa muscular',
};

/** Tape measurements (cm). */
export const BODY_MEASUREMENT_KEYS = [
    'neck',
    'shoulders',
    'chest',
    'waist',
    'hip',
    'arm',
    'thigh',
    'calf',
] as const;
export type BodyMeasurementKey = (typeof BODY_MEASUREMENT_KEYS)[number];

export const BODY_MEASUREMENT_LABELS: Record<BodyMeasurementKey, string> = {
    neck: 'Cuello',
    shoulders: 'Hombros',
    chest: 'Pecho',
    waist: 'Cintura',
    hip: 'Cadera',
    arm: 'Brazo',
    thigh: 'Muslo',
    calf: 'Pantorrilla',
};

// ---------------------------------------------------------------------------
// Módulo opcional
// ---------------------------------------------------------------------------

/** Estado de un módulo opcional (`GET /modules`). */
export interface ModuleStatus {
    key: string;
    name: string;
    description: string;
    /** `true` => oculto hasta que el usuario lo active. */
    opt_in: boolean;
    enabled: boolean;
    enabled_at: string | null;
}

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------

export interface GymExercise {
    id: string;
    /** `null` => catálogo base compartido; con valor => ejercicio propio. */
    user_id: string | null;
    name: string;
    muscle_group: GymMuscleGroup;
    equipment: GymEquipment | null;
    type: GymExerciseType;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface GymRoutineExercise {
    id: string;
    routine_day_id: string;
    exercise_id: string;
    position: number;
    sets: number;
    reps_min: number | null;
    reps_max: number | null;
    target_weight: number | null;
    rest_seconds: number | null;
    superset_group: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface GymRoutineDay {
    id: string;
    routine_id: string;
    day_of_week: DayOfWeek;
    title: string | null;
    is_rest: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
    exercises: GymRoutineExercise[];
}

export interface GymRoutine {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    days: GymRoutineDay[];
}

/** Slot del grid lunes→domingo (`GET /gym/routines/:id/week`). */
export interface GymWeekDay {
    /** `null` cuando ese día nunca se configuró. */
    id: string | null;
    day_of_week: DayOfWeek;
    title: string | null;
    is_rest: boolean;
    notes: string | null;
    exercises: GymRoutineExercise[];
}

export interface GymWeek {
    routine: GymRoutine;
    /** Siempre 7 entradas, de lunes (1) a domingo (7). */
    days: GymWeekDay[];
}

export interface GymSet {
    id: string;
    session_exercise_id: string;
    set_number: number;
    reps: number | null;
    weight: number | null;
    rpe: number | null;
    is_warmup: boolean;
    completed: boolean;
    duration_seconds: number | null;
    distance_meters: number | null;
    created_at: string;
    updated_at: string;
}

export interface GymSessionExercise {
    id: string;
    session_id: string;
    exercise_id: string | null;
    /** Snapshot del nombre al registrar. */
    exercise_name: string;
    muscle_group: GymMuscleGroup | null;
    position: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    sets: GymSet[];
}

export interface GymSession {
    id: string;
    user_id: string;
    routine_id: string | null;
    routine_day_id: string | null;
    /** Día del entrenamiento (`YYYY-MM-DD` en UTC). */
    date: string;
    status: GymSessionStatus;
    started_at: string | null;
    finished_at: string | null;
    duration_minutes: number | null;
    rpe: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    exercises: GymSessionExercise[];
}

export interface GymBodyMetric {
    id: string;
    user_id: string;
    date: string;
    weight_kg: number | null;
    body_fat_pct: number | null;
    muscle_mass_kg: number | null;
    height_cm: number | null;
    measurements: Record<string, number> | null;
    notes: string | null;
    /** Calculado por el backend (peso / altura²). */
    bmi?: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

export interface GymSummary {
    sessions_count: number;
    training_days: number;
    total_sets: number;
    total_reps: number;
    total_volume: number;
    total_duration_minutes: number;
    average_rpe: number | null;
    /** Sesiones planificadas por la rutina activa en el rango. */
    planned_sessions: number | null;
    /** Completadas / planificadas. */
    adherence: number | null;
    range: { from: string; to: string } | null;
}

export interface GymVolumePoint {
    bucket: string;
    sessions: number;
    sets: number;
    reps: number;
    volume: number;
}

export interface GymVolumeSeries {
    period: GymVolumePeriod;
    range: { from: string; to: string } | null;
    data: GymVolumePoint[];
}

export interface GymRecord {
    exercise_id: string | null;
    exercise_name: string;
    muscle_group: string | null;
    max_weight: number;
    max_weight_reps: number | null;
    estimated_1rm: number;
    best_set_volume: number;
    achieved_at: string | null;
}

export interface GymMuscleGroupVolumePoint {
    muscle_group: string | null;
    volume: number;
    sets: number;
    reps: number;
    sessions: number;
}

export interface GymMuscleGroupVolume {
    range: { from: string; to: string } | null;
    data: GymMuscleGroupVolumePoint[];
}

export interface GymLoadDay {
    date: string;
    sessions: number;
    duration_minutes: number;
    srpe: number;
}

export interface GymLoadBucket {
    bucket: string;
    sessions: number;
    duration_minutes: number;
    srpe: number;
}

export interface GymLoad {
    range: { from: string; to: string } | null;
    acute_7d: number;
    chronic_28d_weekly_avg: number;
    /** Carga aguda / crónica (null sin carga crónica). */
    acwr: number | null;
    total_srpe: number;
    data: GymLoadBucket[];
    daily: GymLoadDay[];
}

export interface GymExerciseProgressPoint {
    date: string;
    max_weight: number;
    estimated_1rm: number;
    volume: number;
    sets: number;
    reps: number;
}

export interface GymExerciseProgress {
    exercise_id: string;
    exercise_name: string;
    muscle_group: string | null;
    range: { from: string; to: string } | null;
    data: GymExerciseProgressPoint[];
    progression: {
        volume_change_pct: number | null;
        estimated_1rm_change_pct: number | null;
    };
}

export interface GymCalendarDay {
    /** `YYYY-MM-DD`. */
    date: string;
    day_of_week: DayOfWeek;
    planned: boolean;
    planned_title: string | null;
    planned_routine_day_id: string | null;
    completed: boolean;
    session_id: string | null;
    volume: number;
}

export interface GymCalendar {
    year: number;
    month: number;
    routine_id: string | null;
    routine_name: string | null;
    summary: {
        planned_days: number;
        completed_days: number;
        adherence: number | null;
        total_volume: number;
    };
    data: GymCalendarDay[];
}

export interface GymBodyMetricTrendPoint {
    date: string;
    value: number;
}

export interface GymBodyMetricTrend {
    metric: string;
    range: { from: string; to: string } | null;
    data: GymBodyMetricTrendPoint[];
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

export interface GymExerciseInput {
    name: string;
    muscle_group: GymMuscleGroup;
    equipment?: GymEquipment | null;
    type?: GymExerciseType;
}

export interface GymSetInput {
    set_number?: number;
    reps?: number | null;
    weight?: number | null;
    rpe?: number | null;
    is_warmup?: boolean;
    completed?: boolean;
    duration_seconds?: number | null;
    distance_meters?: number | null;
}

export interface GymSessionExerciseInput {
    exercise_id?: string;
    /** Nombre libre cuando el ejercicio no está en el catálogo. */
    exercise_name?: string;
    muscle_group?: GymMuscleGroup;
    notes?: string;
    sets?: GymSetInput[];
}

export interface GymSessionInput {
    /** `YYYY-MM-DD`; por defecto hoy (UTC). */
    date?: string;
    status?: GymSessionStatus;
    routine_id?: string;
    /** Sin `exercises`: la sesión se precarga desde ese día y arranca en progreso. */
    routine_day_id?: string;
    started_at?: string;
    finished_at?: string;
    duration_minutes?: number;
    rpe?: number;
    notes?: string;
    exercises?: GymSessionExerciseInput[];
}

export interface GymRoutineExerciseInput {
    exercise_id: string;
    position?: number;
    sets?: number;
    reps_min?: number;
    reps_max?: number;
    target_weight?: number;
    rest_seconds?: number;
    superset_group?: string;
    notes?: string;
}

export interface GymRoutineDayInput {
    title?: string;
    is_rest?: boolean;
    notes?: string;
    exercises?: GymRoutineExerciseInput[];
}

export interface GymRoutineInput {
    name: string;
    description?: string | null;
}

export interface GymBodyMetricInput {
    date: string;
    weight_kg?: number;
    body_fat_pct?: number;
    muscle_mass_kg?: number;
    height_cm?: number;
    measurements?: Record<string, number>;
    notes?: string;
}

// ---------------------------------------------------------------------------
// Filtros y helpers
// ---------------------------------------------------------------------------

export interface GymDateFilters {
    preset?: GymDatePreset;
    from?: string;
    to?: string;
}

export interface GymListQuery {
    take?: number;
    cursor?: string | null;
}

/** Fecha del entrenamiento como `YYYY-MM-DD` (sin saltos por zona horaria). */
export function workoutDateOnly(value: string | Date): string {
    return typeof value === 'string'
        ? value.slice(0, 10)
        : value.toISOString().slice(0, 10);
}

/** Hoy como `YYYY-MM-DD` en la zona local (el backend lo interpreta en UTC). */
export function todayWorkoutDate(): string {
    return toWorkoutDate(new Date());
}

/** Fecha local como `YYYY-MM-DD` (para enviar al backend). */
export function toWorkoutDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** ISO day of week (1 = lunes ... 7 = domingo) de una fecha local. */
export function isoDayOfWeek(date: Date = new Date()): DayOfWeek {
    const day = date.getDay();
    return (day === 0 ? 7 : day) as DayOfWeek;
}

/** Volumen de un set: repeticiones × peso (0 en cardio o incompletos). */
export function setVolume(set: GymSet): number {
    if (!set.completed || set.reps == null || set.weight == null) return 0;
    return set.reps * Number(set.weight);
}

/** Volumen total de la sesión registrada. */
export function sessionVolume(session: GymSession): number {
    return (session.exercises ?? []).reduce(
        (total, exercise) =>
            total +
            (exercise.sets ?? []).reduce((sum, set) => sum + setVolume(set), 0),
        0
    );
}

/** Sets completados de la sesión. */
export function sessionSets(session: GymSession): number {
    return (session.exercises ?? []).reduce(
        (total, exercise) =>
            total + (exercise.sets ?? []).filter((set) => set.completed).length,
        0
    );
}

/** Repeticiones completadas de la sesión. */
export function sessionReps(session: GymSession): number {
    return (session.exercises ?? []).reduce(
        (total, exercise) =>
            total +
            (exercise.sets ?? []).reduce(
                (sum, set) => sum + (set.completed ? (set.reps ?? 0) : 0),
                0
            ),
        0
    );
}
