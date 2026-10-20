import { create } from 'zustand';
import {
    BodyMetricMetric,
    GymBodyMetric,
    GymBodyMetricInput,
    GymBodyMetricTrend,
    GymCalendar,
    GymDateFilters,
    GymExercise,
    GymExerciseInput,
    GymExerciseType,
    GymLoad,
    GymMuscleGroup,
    GymMuscleGroupVolume,
    GymRecord,
    GymRoutine,
    GymRoutineDayInput,
    GymRoutineInput,
    GymSession,
    GymSessionInput,
    GymSessionStatus,
    GymSummary,
    GymVolumeSeries,
    GymWeek,
} from '../entities/Gym';
import {
    BodyMetricListQuery,
    ExerciseListQuery,
    gymService,
    SessionListQuery,
} from '../services/gym/gym.service';

interface Pagination {
    cursor: string | null;
    take: number;
    isEnd: boolean;
}

const freshPagination = (take: number): Pagination => ({
    cursor: null,
    take,
    isEnd: false,
});

/** Tamaño de página del módulo (las listas son keyset por cursor). */
const LIST_TAKE = 20;

/** Rango por defecto de los reportes (el backend asume 30 días si no se envía). */
const DEFAULT_REPORT_FILTERS: GymDateFilters = { preset: 'last_30_days' };

interface ExerciseFilters {
    search: string;
    muscle_group: GymMuscleGroup | null;
    type: GymExerciseType | null;
}

interface SessionFilters {
    preset: GymDateFilters['preset'] | null;
    from: string | null;
    to: string | null;
    routine_id: string | null;
    status: GymSessionStatus | null;
}

interface GymStore {
    /** Evita cargar dos veces la primera página. */
    error: string | null;

    // Módulo opcional
    modulesLoading: boolean;
    gymEnabled: boolean;
    loadModules: () => Promise<void>;
    setGymEnabled: (enabled: boolean) => Promise<string | null>;

    // Ejercicios
    exercises: GymExercise[];
    exercisesLoading: boolean;
    exercisesPagination: Pagination;
    exerciseFilters: ExerciseFilters;
    loadExercises: (opts?: { refresh?: boolean }) => Promise<void>;
    setExerciseFilters: (patch: Partial<ExerciseFilters>) => Promise<void>;
    createExercise: (body: GymExerciseInput) => Promise<string | null>;
    updateExercise: (
        id: string,
        body: Partial<GymExerciseInput>
    ) => Promise<string | null>;
    deleteExercise: (id: string) => Promise<string | null>;
    restoreExercise: (id: string) => Promise<string | null>;
    hardDeleteExercise: (id: string) => Promise<string | null>;

    // Rutinas
    routines: GymRoutine[];
    routinesLoading: boolean;
    routinesPagination: Pagination;
    activeRoutine: GymRoutine | null;
    currentRoutine: GymRoutine | null;
    currentWeek: GymWeek | null;
    routineLoading: boolean;
    loadRoutines: (opts?: { refresh?: boolean }) => Promise<void>;
    loadActiveRoutine: () => Promise<void>;
    loadRoutine: (id: string) => Promise<void>;
    createRoutine: (body: GymRoutineInput) => Promise<string | null>;
    updateRoutine: (
        id: string,
        body: Partial<GymRoutineInput>
    ) => Promise<string | null>;
    setRoutineDay: (
        routineId: string,
        dayOfWeek: number,
        body: GymRoutineDayInput
    ) => Promise<string | null>;
    deleteRoutineDay: (
        routineId: string,
        dayOfWeek: number
    ) => Promise<string | null>;
    activateRoutine: (id: string) => Promise<string | null>;
    deactivateRoutine: (id: string) => Promise<string | null>;
    deleteRoutine: (id: string) => Promise<string | null>;
    restoreRoutine: (id: string) => Promise<string | null>;

    // Sesiones
    sessions: GymSession[];
    sessionsLoading: boolean;
    sessionsPagination: Pagination;
    sessionFilters: SessionFilters;
    currentSession: GymSession | null;
    sessionLoading: boolean;
    loadSessions: (opts?: { refresh?: boolean }) => Promise<void>;
    setSessionFilters: (patch: Partial<SessionFilters>) => Promise<void>;
    loadSession: (id: string) => Promise<void>;
    createSession: (body: GymSessionInput) => Promise<string | null>;
    updateSession: (
        id: string,
        body: Partial<GymSessionInput>
    ) => Promise<string | null>;
    deleteSession: (id: string) => Promise<string | null>;
    restoreSession: (id: string) => Promise<string | null>;

    // Medidas corporales
    bodyMetrics: GymBodyMetric[];
    metricsLoading: boolean;
    metricsPagination: Pagination;
    latestMetric: GymBodyMetric | null;
    metricTrend: GymBodyMetricTrend | null;
    metricTrendMetric: BodyMetricMetric;
    loadBodyMetrics: (opts?: { refresh?: boolean }) => Promise<void>;
    loadLatestMetric: () => Promise<void>;
    loadMetricTrend: (metric: BodyMetricMetric) => Promise<void>;
    upsertBodyMetric: (body: GymBodyMetricInput) => Promise<string | null>;
    updateBodyMetric: (
        id: string,
        body: Partial<GymBodyMetricInput>
    ) => Promise<string | null>;
    deleteBodyMetric: (id: string) => Promise<string | null>;
    hardDeleteBodyMetric: (id: string) => Promise<string | null>;

    // Reportes
    reportFilters: GymDateFilters;
    summary: GymSummary | null;
    volumeSeries: GymVolumeSeries | null;
    muscleGroups: GymMuscleGroupVolume | null;
    trainingLoad: GymLoad | null;
    records: GymRecord[];
    calendar: GymCalendar | null;
    reportsLoading: boolean;
    setReportFilters: (patch: Partial<GymDateFilters>) => Promise<void>;
    loadReports: () => Promise<void>;
    loadRecords: (opts?: { muscle_group?: string }) => Promise<void>;
    loadCalendar: (q?: { year?: number; month?: number }) => Promise<void>;

    /** Limpia el estado al desactivar el módulo o cerrar sesión. */
    reset: () => void;
}

const initialState = {
    error: null as string | null,

    modulesLoading: false,
    gymEnabled: false,

    exercises: [] as GymExercise[],
    exercisesLoading: false,
    exercisesPagination: freshPagination(LIST_TAKE),
    exerciseFilters: {
        search: '',
        muscle_group: null,
        type: null,
    } as ExerciseFilters,

    routines: [] as GymRoutine[],
    routinesLoading: false,
    routinesPagination: freshPagination(LIST_TAKE),
    activeRoutine: null as GymRoutine | null,
    currentRoutine: null as GymRoutine | null,
    currentWeek: null as GymWeek | null,
    routineLoading: false,

    sessions: [] as GymSession[],
    sessionsLoading: false,
    sessionsPagination: freshPagination(LIST_TAKE),
    sessionFilters: {
        preset: null,
        from: null,
        to: null,
        routine_id: null,
        status: null,
    } as SessionFilters,
    currentSession: null as GymSession | null,
    sessionLoading: false,

    bodyMetrics: [] as GymBodyMetric[],
    metricsLoading: false,
    metricsPagination: freshPagination(LIST_TAKE),
    latestMetric: null as GymBodyMetric | null,
    metricTrend: null as GymBodyMetricTrend | null,
    metricTrendMetric: 'weight_kg' as BodyMetricMetric,

    reportFilters: { ...DEFAULT_REPORT_FILTERS },
    summary: null as GymSummary | null,
    volumeSeries: null as GymVolumeSeries | null,
    muscleGroups: null as GymMuscleGroupVolume | null,
    trainingLoad: null as GymLoad | null,
    records: [] as GymRecord[],
    calendar: null as GymCalendar | null,
    reportsLoading: false,
};

export const useGymStore = create<GymStore>((set, get) => ({
    ...initialState,

    reset: () => set({ ...initialState, reportFilters: { ...DEFAULT_REPORT_FILTERS } }),

    // ---------------- Módulo opcional ----------------
    loadModules: async () => {
        set({ modulesLoading: true });
        try {
            const { error, response } = await gymService.getModules();
            if (error) throw new Error(error);

            const gym = (response ?? []).find((module) => module.key === 'gym');
            set({ gymEnabled: gym?.enabled ?? false, modulesLoading: false });
        } catch (e: any) {
            set({
                modulesLoading: false,
                error: e?.message ?? 'No se pudo cargar el módulo',
            });
        }
    },

    setGymEnabled: async (enabled) => {
        try {
            const { error, response } = await gymService.setModuleEnabled(
                'gym',
                enabled
            );
            if (error) return error;

            set({ gymEnabled: response?.enabled ?? enabled });
            if (!enabled) get().reset();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al cambiar el módulo';
        }
    },

    // ---------------- Ejercicios ----------------
    loadExercises: async (opts) => {
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.exercisesLoading && !refresh) return;
        if (!refresh && state.exercisesPagination.isEnd) return;

        set({ exercisesLoading: true });
        try {
            const query: ExerciseListQuery = {
                take: state.exercisesPagination.take,
                cursor: refresh ? null : state.exercisesPagination.cursor,
                search: state.exerciseFilters.search || undefined,
                muscle_group: state.exerciseFilters.muscle_group ?? undefined,
                type: state.exerciseFilters.type ?? undefined,
            };

            const { error, response } = await gymService.listExercises(query);
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;

            set((s) => ({
                exercises: refresh
                    ? data
                    : [
                          ...s.exercises,
                          ...data.filter(
                              (item) => !s.exercises.some((x) => x.id === item.id)
                          ),
                      ],
                exercisesPagination: {
                    ...s.exercisesPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                exercisesLoading: false,
            }));
        } catch (e: any) {
            set({
                exercisesLoading: false,
                error: e?.message ?? 'Error al cargar los ejercicios',
            });
        }
    },

    setExerciseFilters: async (patch) => {
        set((s) => ({ exerciseFilters: { ...s.exerciseFilters, ...patch } }));
        await get().loadExercises({ refresh: true });
    },

    createExercise: async (body) => {
        try {
            const { error } = await gymService.createExercise(body);
            if (error) return error;
            await get().loadExercises({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al crear el ejercicio';
        }
    },

    updateExercise: async (id, body) => {
        try {
            const { error } = await gymService.updateExercise(id, body);
            if (error) return error;
            await get().loadExercises({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar el ejercicio';
        }
    },

    deleteExercise: async (id) => {
        try {
            const { error } = await gymService.deleteExercise(id);
            if (error) return error;
            set((s) => ({
                exercises: s.exercises.filter((item) => item.id !== id),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el ejercicio';
        }
    },

    restoreExercise: async (id) => {
        try {
            const { error } = await gymService.restoreExercise(id);
            if (error) return error;
            await get().loadExercises({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el ejercicio';
        }
    },

    hardDeleteExercise: async (id) => {
        try {
            const { error } = await gymService.hardDeleteExercise(id);
            if (error) return error;
            set((s) => ({
                exercises: s.exercises.filter((item) => item.id !== id),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el ejercicio';
        }
    },

    // ---------------- Rutinas ----------------
    loadRoutines: async (opts) => {
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.routinesLoading && !refresh) return;
        if (!refresh && state.routinesPagination.isEnd) return;

        set({ routinesLoading: true });
        try {
            const { error, response } = await gymService.listRoutines({
                take: state.routinesPagination.take,
                cursor: refresh ? null : state.routinesPagination.cursor,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;

            set((s) => ({
                routines: refresh
                    ? data
                    : [
                          ...s.routines,
                          ...data.filter(
                              (item) => !s.routines.some((x) => x.id === item.id)
                          ),
                      ],
                routinesPagination: {
                    ...s.routinesPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                routinesLoading: false,
            }));
        } catch (e: any) {
            set({
                routinesLoading: false,
                error: e?.message ?? 'Error al cargar las rutinas',
            });
        }
    },

    loadActiveRoutine: async () => {
        try {
            const { error, response } = await gymService.getActiveRoutine();
            if (error) throw new Error(error);
            set({ activeRoutine: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar la rutina activa' });
        }
    },

    loadRoutine: async (id) => {
        set({ routineLoading: true });
        try {
            const [routine, week] = await Promise.all([
                gymService.getRoutine(id),
                gymService.getRoutineWeek(id),
            ]);

            if (routine.error) throw new Error(routine.error);

            set({
                currentRoutine: routine.response ?? null,
                currentWeek: week.response ?? null,
                routineLoading: false,
            });
        } catch (e: any) {
            set({
                routineLoading: false,
                error: e?.message ?? 'Error al cargar la rutina',
            });
        }
    },

    createRoutine: async (body) => {
        try {
            const { error, response } = await gymService.createRoutine(body);
            if (error) return error;
            await get().loadRoutines({ refresh: true });
            if (response) set({ currentRoutine: response });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al crear la rutina';
        }
    },

    updateRoutine: async (id, body) => {
        try {
            const { error, response } = await gymService.updateRoutine(id, body);
            if (error) return error;
            set((s) => ({
                currentRoutine:
                    s.currentRoutine?.id === id && response
                        ? response
                        : s.currentRoutine,
            }));
            await get().loadRoutines({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar la rutina';
        }
    },

    setRoutineDay: async (routineId, dayOfWeek, body) => {
        try {
            const { error } = await gymService.setRoutineDay(
                routineId,
                dayOfWeek,
                body
            );
            if (error) return error;
            await get().loadRoutine(routineId);
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al guardar el día';
        }
    },

    deleteRoutineDay: async (routineId, dayOfWeek) => {
        try {
            const { error } = await gymService.deleteRoutineDay(
                routineId,
                dayOfWeek
            );
            if (error) return error;
            await get().loadRoutine(routineId);
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al borrar el día';
        }
    },

    activateRoutine: async (id) => {
        try {
            const { error, response } = await gymService.activateRoutine(id);
            if (error) return error;
            set({
                activeRoutine: response ?? null,
                currentRoutine: response ?? get().currentRoutine,
            });
            await get().loadRoutines({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al activar la rutina';
        }
    },

    deactivateRoutine: async (id) => {
        try {
            const { error } = await gymService.deactivateRoutine(id);
            if (error) return error;
            await Promise.all([
                get().loadActiveRoutine(),
                get().loadRoutines({ refresh: true }),
            ]);
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al desactivar la rutina';
        }
    },

    deleteRoutine: async (id) => {
        try {
            const { error } = await gymService.deleteRoutine(id);
            if (error) return error;
            set((s) => ({
                routines: s.routines.filter((item) => item.id !== id),
                currentRoutine:
                    s.currentRoutine?.id === id ? null : s.currentRoutine,
                activeRoutine:
                    s.activeRoutine?.id === id ? null : s.activeRoutine,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la rutina';
        }
    },

    restoreRoutine: async (id) => {
        try {
            const { error } = await gymService.restoreRoutine(id);
            if (error) return error;
            await get().loadRoutines({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar la rutina';
        }
    },

    // ---------------- Sesiones ----------------
    loadSessions: async (opts) => {
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.sessionsLoading && !refresh) return;
        if (!refresh && state.sessionsPagination.isEnd) return;

        set({ sessionsLoading: true });
        try {
            const filters = state.sessionFilters;
            const query: SessionListQuery = {
                take: state.sessionsPagination.take,
                cursor: refresh ? null : state.sessionsPagination.cursor,
                preset: filters.preset ?? undefined,
                from: filters.from ?? undefined,
                to: filters.to ?? undefined,
                routine_id: filters.routine_id ?? undefined,
                status: filters.status ?? undefined,
            };

            const { error, response } = await gymService.listSessions(query);
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;

            set((s) => ({
                sessions: refresh
                    ? data
                    : [
                          ...s.sessions,
                          ...data.filter(
                              (item) => !s.sessions.some((x) => x.id === item.id)
                          ),
                      ],
                sessionsPagination: {
                    ...s.sessionsPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                sessionsLoading: false,
            }));
        } catch (e: any) {
            set({
                sessionsLoading: false,
                error: e?.message ?? 'Error al cargar los entrenamientos',
            });
        }
    },

    setSessionFilters: async (patch) => {
        set((s) => ({ sessionFilters: { ...s.sessionFilters, ...patch } }));
        await get().loadSessions({ refresh: true });
    },

    loadSession: async (id) => {
        set({ sessionLoading: true });
        try {
            const { error, response } = await gymService.getSession(id);
            if (error) throw new Error(error);
            set({ currentSession: response ?? null, sessionLoading: false });
        } catch (e: any) {
            set({
                sessionLoading: false,
                error: e?.message ?? 'Error al cargar el entrenamiento',
            });
        }
    },

    createSession: async (body) => {
        try {
            const { error } = await gymService.createSession(body);
            if (error) return error;

            // El entrenamiento cambia los reportes: se refrescan en segundo plano.
            void get().loadSessions({ refresh: true });
            void get().loadReports();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al registrar el entrenamiento';
        }
    },

    updateSession: async (id, body) => {
        try {
            const { error, response } = await gymService.updateSession(id, body);
            if (error) return error;
            set({ currentSession: response ?? get().currentSession });
            void get().loadSessions({ refresh: true });
            void get().loadReports();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar el entrenamiento';
        }
    },

    deleteSession: async (id) => {
        try {
            const { error } = await gymService.deleteSession(id);
            if (error) return error;
            set((s) => ({
                sessions: s.sessions.filter((item) => item.id !== id),
                currentSession:
                    s.currentSession?.id === id ? null : s.currentSession,
            }));
            void get().loadReports();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el entrenamiento';
        }
    },

    restoreSession: async (id) => {
        try {
            const { error } = await gymService.restoreSession(id);
            if (error) return error;
            await get().loadSessions({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el entrenamiento';
        }
    },

    // ---------------- Medidas corporales ----------------
    loadBodyMetrics: async (opts) => {
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.metricsLoading && !refresh) return;
        if (!refresh && state.metricsPagination.isEnd) return;

        set({ metricsLoading: true });
        try {
            const query: BodyMetricListQuery = {
                take: state.metricsPagination.take,
                cursor: refresh ? null : state.metricsPagination.cursor,
            };

            const { error, response } = await gymService.listBodyMetrics(query);
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;

            set((s) => ({
                bodyMetrics: refresh
                    ? data
                    : [
                          ...s.bodyMetrics,
                          ...data.filter(
                              (item) => !s.bodyMetrics.some((x) => x.id === item.id)
                          ),
                      ],
                metricsPagination: {
                    ...s.metricsPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                metricsLoading: false,
            }));
        } catch (e: any) {
            set({
                metricsLoading: false,
                error: e?.message ?? 'Error al cargar las medidas',
            });
        }
    },

    loadLatestMetric: async () => {
        try {
            const { error, response } = await gymService.latestBodyMetric();
            if (error) throw new Error(error);
            set({ latestMetric: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar la última medida' });
        }
    },

    loadMetricTrend: async (metric) => {
        set({ metricTrendMetric: metric, metricTrend: null });
        try {
            const { error, response } = await gymService.bodyMetricTrend(metric);
            if (error) throw new Error(error);
            set({ metricTrend: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar la tendencia' });
        }
    },

    upsertBodyMetric: async (body) => {
        try {
            const { error } = await gymService.upsertBodyMetric(body);
            if (error) return error;
            await Promise.all([
                get().loadBodyMetrics({ refresh: true }),
                get().loadLatestMetric(),
                get().loadMetricTrend(get().metricTrendMetric),
            ]);
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al guardar la medida';
        }
    },

    updateBodyMetric: async (id, body) => {
        try {
            const { error } = await gymService.updateBodyMetric(id, body);
            if (error) return error;
            await Promise.all([
                get().loadBodyMetrics({ refresh: true }),
                get().loadLatestMetric(),
                get().loadMetricTrend(get().metricTrendMetric),
            ]);
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar la medida';
        }
    },

    deleteBodyMetric: async (id) => {
        try {
            const { error } = await gymService.deleteBodyMetric(id);
            if (error) return error;
            set((s) => ({
                bodyMetrics: s.bodyMetrics.filter((item) => item.id !== id),
            }));
            void get().loadLatestMetric();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la medida';
        }
    },

    hardDeleteBodyMetric: async (id) => {
        try {
            const { error } = await gymService.hardDeleteBodyMetric(id);
            if (error) return error;
            set((s) => ({
                bodyMetrics: s.bodyMetrics.filter((item) => item.id !== id),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la medida';
        }
    },

    // ---------------- Reportes ----------------
    setReportFilters: async (patch) => {
        set((s) => ({ reportFilters: { ...s.reportFilters, ...patch } }));
        await get().loadReports();
    },

    loadReports: async () => {
        const filters = get().reportFilters;
        set({ reportsLoading: true });

        try {
            const [summary, volume, muscles, load] = await Promise.all([
                gymService.getSummary(filters),
                gymService.getVolumeSeries(filters, 'day'),
                gymService.getMuscleGroups(filters),
                gymService.getLoad(filters, 'week'),
            ]);

            set({
                summary: summary.response ?? null,
                volumeSeries: volume.response ?? null,
                muscleGroups: muscles.response ?? null,
                trainingLoad: load.response ?? null,
                reportsLoading: false,
            });
        } catch (e: any) {
            set({
                reportsLoading: false,
                error: e?.message ?? 'Error al cargar los reportes',
            });
        }
    },

    loadRecords: async (opts) => {
        try {
            const { error, response } = await gymService.getRecords({
                muscle_group: opts?.muscle_group,
            });
            if (error) throw new Error(error);
            set({ records: response?.data ?? [] });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar los récords' });
        }
    },

    loadCalendar: async (q) => {
        try {
            const { error, response } = await gymService.getCalendar(q);
            if (error) throw new Error(error);
            set({ calendar: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar el calendario' });
        }
    },
}));
