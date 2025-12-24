import { MALET_API_URL } from '@/shared/config/malet.config';
import {
    createTimeoutController,
    ensureArray,
    HttpError,
    HttpResult,
    parseError,
    parseResponse,
} from '@/shared/http/HttpError';
import {
    DashboardData,
    GarzonCompleteResponse,
    GarzonSession,
    TopCliente,
    TopPago,
    TopProducto,
    VentasDepartamento,
    VentasTienda,
} from '@/shared/interfaces/garzon.interfaces';

const API_BASE_URL = MALET_API_URL;
const REQUEST_TIMEOUT = 15000;

// Alias para compatibilidad con código existente
const ApiError = HttpError;
type ApiResult<T> = HttpResult<T>;

/**
 * Helper para hacer peticiones POST con timeout y manejo robusto de errores
 */
async function post<T>(endpoint: string, body: object): Promise<T> {
    const { controller, cleanup } = createTimeoutController(REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        cleanup();
        return await parseResponse<T>(response);
    } catch (error) {
        cleanup();
        throw parseError(error);
    }
}

/**
 * Versión segura de post que retorna ApiResult en lugar de lanzar excepciones
 */
async function safePost<T>(endpoint: string, body: object): Promise<ApiResult<T>> {
    try {
        const data = await post<T>(endpoint, body);
        return { success: true, data, error: null };
    } catch (error) {
        return {
            success: false,
            data: null,
            error: parseError(error),
        };
    }
}

/**
 * Valores por defecto para DashboardData (evita crashes por datos undefined)
 */
const DEFAULT_DASHBOARD_DATA: DashboardData = {
    ventasPorTienda: [],
    topClientes: [],
    topPagos: [],
    topProductos: [],
    ventasPorDepartamento: [],
};

/**
 * Normaliza los datos del dashboard asegurando que todos los arrays existan
 */
function normalizeDashboardData(data: Partial<DashboardData> | null | undefined): DashboardData {
    if (!data) return DEFAULT_DASHBOARD_DATA;

    return {
        ventasPorTienda: ensureArray(data.ventasPorTienda),
        topClientes: ensureArray(data.topClientes),
        topPagos: ensureArray(data.topPagos),
        topProductos: ensureArray(data.topProductos),
        ventasPorDepartamento: ensureArray(data.ventasPorDepartamento),
    };
}

export const garzonApi = {
    /**
     * Login + obtener dashboard en una sola llamada
     * Endpoint: POST /garzon/dashboard/complete
     */
    loginAndGetDashboard: async (
        username: string,
        password: string,
        stid: number = 0
    ): Promise<GarzonCompleteResponse> => {
        const response = await post<GarzonCompleteResponse>('/garzon/dashboard/complete', {
            username,
            password,
            stid,
        });

        // Normalizar dashboard para evitar undefined en arrays
        return {
            ...response,
            dashboard: normalizeDashboardData(response.dashboard),
        };
    },

    /**
     * Obtener todos los datos del dashboard (requiere sesión)
     * Endpoint: POST /garzon/dashboard/all
     */
    getDashboard: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<DashboardData> => {
        const data = await post<DashboardData>('/garzon/dashboard/all', {
            session,
            stid,
        });

        // Normalizar para evitar undefined en arrays
        return normalizeDashboardData(data);
    },

    /**
     * Verificar si la sesión sigue válida
     * Intenta obtener datos, si falla con 401 la sesión expiró
     */
    verifySession: async (session: GarzonSession): Promise<boolean> => {
        try {
            await post('/garzon/dashboard/all', { session, stid: 0 });
            return true;
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return false;
            }
            throw error;
        }
    },

    /**
     * Obtener ventas por tienda
     */
    getVentasPorTienda: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<VentasTienda[]> => {
        const data = await post<VentasTienda[]>('/garzon/dashboard/ventas-tienda', {
            session,
            stid,
        });
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtener top clientes
     */
    getTopClientes: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopCliente[]> => {
        const data = await post<TopCliente[]>('/garzon/dashboard/top-clientes', {
            session,
            stid,
        });
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtener top pagos
     */
    getTopPagos: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopPago[]> => {
        const data = await post<TopPago[]>('/garzon/dashboard/top-pagos', {
            session,
            stid,
        });
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtener top productos
     */
    getTopProductos: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopProducto[]> => {
        const data = await post<TopProducto[]>('/garzon/dashboard/top-productos', {
            session,
            stid,
        });
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtener ventas por departamento
     */
    getVentasPorDepartamento: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<VentasDepartamento[]> => {
        const data = await post<VentasDepartamento[]>('/garzon/dashboard/ventas-departamento', {
            session,
            stid,
        });
        return Array.isArray(data) ? data : [];
    },
};

export { ApiError, DEFAULT_DASHBOARD_DATA, normalizeDashboardData, safePost };
export type { ApiResult };

