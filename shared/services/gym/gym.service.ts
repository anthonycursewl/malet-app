import { MALET_API_URL } from '../../config/malet.config';
import {
    BodyMetricMetric,
    GymBodyMetric,
    GymBodyMetricInput,
    GymBodyMetricTrend,
    GymCalendar,
    GymDateFilters,
    GymExercise,
    GymExerciseInput,
    GymExerciseProgress,
    GymListQuery,
    GymLoad,
    GymMuscleGroupVolume,
    GymRecord,
    GymRoutine,
    GymRoutineDayInput,
    GymRoutineInput,
    GymSession,
    GymSessionInput,
    GymSessionStatus,
    GymSummary,
    GymVolumePeriod,
    GymVolumeSeries,
    GymWeek,
    ModuleStatus,
} from '../../entities/Gym';
import { CursorList } from '../../entities/SalesModule';
import { secureFetch, SecureFetchResponse } from '../../http/secureFetch';

const GYM = `${MALET_API_URL}/gym`;
const MODULES = `${MALET_API_URL}/modules`;

type QueryValue = string | number | boolean | null | undefined;

/** Query string omitiendo null/undefined/vacíos. */
function qs(params: Record<string, QueryValue>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        search.append(key, String(value));
    }
    const str = search.toString();
    return str ? `?${str}` : '';
}

function listParams(q?: GymListQuery): Record<string, QueryValue> {
    return { take: q?.take, cursor: q?.cursor ?? undefined };
}

/** Filtros de rango compartidos por sesiones, medidas y reportes. */
function rangeParams(filters?: GymDateFilters | null): Record<string, QueryValue> {
    if (!filters) return {};
    return {
        preset: filters.preset ?? undefined,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
    };
}

/** DELETE/restore cuyo 2xx puede venir sin cuerpo. */
async function requestVoid(opts: {
    url: string;
    method: 'DELETE' | 'PUT' | 'POST';
}): Promise<SecureFetchResponse<null>> {
    const res = await secureFetch<null>(opts);
    if (res.httpError?.code === 'EMPTY_RESPONSE') {
        return { error: null, response: null, httpError: null };
    }
    return res;
}

export interface SessionListQuery extends GymListQuery, GymDateFilters {
    routine_id?: string;
    routine_day_id?: string;
    status?: GymSessionStatus;
}

export interface ExerciseListQuery extends GymListQuery {
    search?: string;
    muscle_group?: string;
    type?: string;
}

export interface BodyMetricListQuery extends GymListQuery, GymDateFilters {}

export interface RecordsQuery {
    muscle_group?: string;
    limit?: number;
}

/**
 * Cliente del módulo Gym. Todas las rutas exigen que el módulo esté activado
 * (el backend responde 403 si no lo está).
 */
export const gymService = {
    // ---------- Módulo opcional ----------
    getModules: (): Promise<SecureFetchResponse<ModuleStatus[]>> =>
        secureFetch<ModuleStatus[]>({ url: MODULES, method: 'GET' }),

    setModuleEnabled: (
        key: string,
        enabled: boolean
    ): Promise<SecureFetchResponse<ModuleStatus>> =>
        secureFetch<ModuleStatus>({
            url: `${MODULES}/${key}`,
            method: 'PUT',
            body: { enabled },
        }),

    // ---------- Ejercicios ----------
    listExercises: (
        q?: ExerciseListQuery
    ): Promise<SecureFetchResponse<CursorList<GymExercise>>> =>
        secureFetch<CursorList<GymExercise>>({
            url: `${GYM}/exercises${qs({
                ...listParams(q),
                search: q?.search,
                muscle_group: q?.muscle_group,
                type: q?.type,
            })}`,
            method: 'GET',
        }),

    createExercise: (body: GymExerciseInput): Promise<SecureFetchResponse<GymExercise>> =>
        secureFetch<GymExercise>({ url: `${GYM}/exercises`, method: 'POST', body }),

    getExercise: (id: string): Promise<SecureFetchResponse<GymExercise>> =>
        secureFetch<GymExercise>({ url: `${GYM}/exercises/${id}`, method: 'GET' }),

    updateExercise: (
        id: string,
        body: Partial<GymExerciseInput>
    ): Promise<SecureFetchResponse<GymExercise>> =>
        secureFetch<GymExercise>({ url: `${GYM}/exercises/${id}`, method: 'PUT', body }),

    deleteExercise: (id: string): Promise<SecureFetchResponse<GymExercise>> =>
        secureFetch<GymExercise>({ url: `${GYM}/exercises/${id}`, method: 'DELETE' }),

    restoreExercise: (id: string): Promise<SecureFetchResponse<GymExercise>> =>
        secureFetch<GymExercise>({ url: `${GYM}/exercises/${id}/restore`, method: 'PUT' }),

    hardDeleteExercise: (id: string) =>
        requestVoid({ url: `${GYM}/exercises/${id}/hard`, method: 'DELETE' }),

    // ---------- Rutinas ----------
    listRoutines: (q?: GymListQuery): Promise<SecureFetchResponse<CursorList<GymRoutine>>> =>
        secureFetch<CursorList<GymRoutine>>({
            url: `${GYM}/routines${qs(listParams(q))}`,
            method: 'GET',
        }),

    /** Rutina activa del usuario (o `null`). */
    getActiveRoutine: (): Promise<SecureFetchResponse<GymRoutine | null>> =>
        secureFetch<GymRoutine | null>({ url: `${GYM}/routines/active`, method: 'GET' }),

    getRoutine: (id: string): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}`, method: 'GET' }),

    /** Grid lunes→domingo (siempre 7 días). */
    getRoutineWeek: (id: string): Promise<SecureFetchResponse<GymWeek>> =>
        secureFetch<GymWeek>({ url: `${GYM}/routines/${id}/week`, method: 'GET' }),

    createRoutine: (body: GymRoutineInput): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines`, method: 'POST', body }),

    updateRoutine: (
        id: string,
        body: Partial<GymRoutineInput>
    ): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}`, method: 'PUT', body }),

    /** Reemplaza el contenido completo de un día (título, descanso y ejercicios). */
    setRoutineDay: (
        routineId: string,
        dayOfWeek: number,
        body: GymRoutineDayInput
    ): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({
            url: `${GYM}/routines/${routineId}/days/${dayOfWeek}`,
            method: 'PUT',
            body,
        }),

    deleteRoutineDay: (
        routineId: string,
        dayOfWeek: number
    ): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({
            url: `${GYM}/routines/${routineId}/days/${dayOfWeek}`,
            method: 'DELETE',
        }),

    activateRoutine: (id: string): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}/activate`, method: 'PUT' }),

    deactivateRoutine: (id: string): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}/deactivate`, method: 'PUT' }),

    deleteRoutine: (id: string): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}`, method: 'DELETE' }),

    restoreRoutine: (id: string): Promise<SecureFetchResponse<GymRoutine>> =>
        secureFetch<GymRoutine>({ url: `${GYM}/routines/${id}/restore`, method: 'PUT' }),

    hardDeleteRoutine: (id: string) =>
        requestVoid({ url: `${GYM}/routines/${id}/hard`, method: 'DELETE' }),

    // ---------- Sesiones ----------
    listSessions: (q?: SessionListQuery): Promise<SecureFetchResponse<CursorList<GymSession>>> =>
        secureFetch<CursorList<GymSession>>({
            url: `${GYM}/sessions${qs({
                ...listParams(q),
                ...rangeParams(q),
                routine_id: q?.routine_id,
                routine_day_id: q?.routine_day_id,
                status: q?.status,
            })}`,
            method: 'GET',
        }),

    getSession: (id: string): Promise<SecureFetchResponse<GymSession>> =>
        secureFetch<GymSession>({ url: `${GYM}/sessions/${id}`, method: 'GET' }),

    createSession: (body: GymSessionInput): Promise<SecureFetchResponse<GymSession>> =>
        secureFetch<GymSession>({ url: `${GYM}/sessions`, method: 'POST', body }),

    updateSession: (
        id: string,
        body: Partial<GymSessionInput>
    ): Promise<SecureFetchResponse<GymSession>> =>
        secureFetch<GymSession>({ url: `${GYM}/sessions/${id}`, method: 'PUT', body }),

    deleteSession: (id: string): Promise<SecureFetchResponse<GymSession>> =>
        secureFetch<GymSession>({ url: `${GYM}/sessions/${id}`, method: 'DELETE' }),

    restoreSession: (id: string): Promise<SecureFetchResponse<GymSession>> =>
        secureFetch<GymSession>({ url: `${GYM}/sessions/${id}/restore`, method: 'PUT' }),

    hardDeleteSession: (id: string) =>
        requestVoid({ url: `${GYM}/sessions/${id}/hard`, method: 'DELETE' }),

    // ---------- Medidas corporales ----------
    /** Crea la entrada de esa fecha o reemplaza la existente. */
    upsertBodyMetric: (body: GymBodyMetricInput): Promise<SecureFetchResponse<GymBodyMetric>> =>
        secureFetch<GymBodyMetric>({ url: `${GYM}/body-metrics`, method: 'POST', body }),

    listBodyMetrics: (
        q?: BodyMetricListQuery
    ): Promise<SecureFetchResponse<CursorList<GymBodyMetric>>> =>
        secureFetch<CursorList<GymBodyMetric>>({
            url: `${GYM}/body-metrics${qs({ ...listParams(q), ...rangeParams(q) })}`,
            method: 'GET',
        }),

    latestBodyMetric: (): Promise<SecureFetchResponse<GymBodyMetric | null>> =>
        secureFetch<GymBodyMetric | null>({ url: `${GYM}/body-metrics/latest`, method: 'GET' }),

    bodyMetricTrend: (
        metric: BodyMetricMetric,
        filters?: GymDateFilters
    ): Promise<SecureFetchResponse<GymBodyMetricTrend>> =>
        secureFetch<GymBodyMetricTrend>({
            url: `${GYM}/body-metrics/trend${qs({ metric, ...rangeParams(filters) })}`,
            method: 'GET',
        }),

    getBodyMetric: (id: string): Promise<SecureFetchResponse<GymBodyMetric>> =>
        secureFetch<GymBodyMetric>({ url: `${GYM}/body-metrics/${id}`, method: 'GET' }),

    updateBodyMetric: (
        id: string,
        body: Partial<GymBodyMetricInput>
    ): Promise<SecureFetchResponse<GymBodyMetric>> =>
        secureFetch<GymBodyMetric>({ url: `${GYM}/body-metrics/${id}`, method: 'PUT', body }),

    deleteBodyMetric: (id: string): Promise<SecureFetchResponse<GymBodyMetric>> =>
        secureFetch<GymBodyMetric>({ url: `${GYM}/body-metrics/${id}`, method: 'DELETE' }),

    restoreBodyMetric: (id: string): Promise<SecureFetchResponse<GymBodyMetric>> =>
        secureFetch<GymBodyMetric>({
            url: `${GYM}/body-metrics/${id}/restore`,
            method: 'PUT',
        }),

    hardDeleteBodyMetric: (id: string) =>
        requestVoid({ url: `${GYM}/body-metrics/${id}/hard`, method: 'DELETE' }),

    // ---------- Reportes ----------
    /** Volumen, adherencia y carga del rango (por defecto: últimos 30 días). */
    getSummary: (filters?: GymDateFilters): Promise<SecureFetchResponse<GymSummary>> =>
        secureFetch<GymSummary>({
            url: `${GYM}/summary${qs(rangeParams(filters))}`,
            method: 'GET',
        }),

    getVolumeSeries: (
        filters?: GymDateFilters,
        period: GymVolumePeriod = 'day'
    ): Promise<SecureFetchResponse<GymVolumeSeries>> =>
        secureFetch<GymVolumeSeries>({
            url: `${GYM}/analytics/volume${qs({ ...rangeParams(filters), period })}`,
            method: 'GET',
        }),

    getMuscleGroups: (
        filters?: GymDateFilters
    ): Promise<SecureFetchResponse<GymMuscleGroupVolume>> =>
        secureFetch<GymMuscleGroupVolume>({
            url: `${GYM}/analytics/muscle-groups${qs(rangeParams(filters))}`,
            method: 'GET',
        }),

    /** Carga interna: sRPE por bucket + ratio agudo:crónico. */
    getLoad: (
        filters?: GymDateFilters,
        period: GymVolumePeriod = 'week'
    ): Promise<SecureFetchResponse<GymLoad>> =>
        secureFetch<GymLoad>({
            url: `${GYM}/analytics/load${qs({ ...rangeParams(filters), period })}`,
            method: 'GET',
        }),

    getExerciseProgress: (
        exerciseId: string,
        filters?: GymDateFilters
    ): Promise<SecureFetchResponse<GymExerciseProgress>> =>
        secureFetch<GymExerciseProgress>({
            url: `${GYM}/analytics/exercises/${exerciseId}/progress${qs(
                rangeParams(filters)
            )}`,
            method: 'GET',
        }),

    /** Récords personales de por vida por ejercicio. */
    getRecords: (q?: RecordsQuery): Promise<SecureFetchResponse<{ data: GymRecord[] }>> =>
        secureFetch<{ data: GymRecord[] }>({
            url: `${GYM}/records${qs({ muscle_group: q?.muscle_group, limit: q?.limit })}`,
            method: 'GET',
        }),

    /** Vista mensual: días planificados vs sesiones completadas. */
    getCalendar: (q?: {
        year?: number;
        month?: number;
        routine_id?: string;
    }): Promise<SecureFetchResponse<GymCalendar>> =>
        secureFetch<GymCalendar>({
            url: `${GYM}/calendar${qs({
                year: q?.year,
                month: q?.month,
                routine_id: q?.routine_id,
            })}`,
            method: 'GET',
        }),
};
