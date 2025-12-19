import { MALET_API_URL } from '@/shared/config/malet.config';
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

/**
 * Error personalizado con status HTTP
 */
class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

/**
 * Helper para hacer peticiones POST
 */
async function post<T>(endpoint: string, body: object): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new ApiError(
                data.message || `Error ${response.status}`,
                response.status
            );
        }

        return data as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError('Error de conexión con el servidor', 0);
    }
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
        return post<GarzonCompleteResponse>('/garzon/dashboard/complete', {
            username,
            password,
            stid,
        });
    },

    /**
     * Obtener todos los datos del dashboard (requiere sesión)
     * Endpoint: POST /garzon/dashboard/all
     */
    getDashboard: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<DashboardData> => {
        return post<DashboardData>('/garzon/dashboard/all', {
            session,
            stid,
        });
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
        return post<VentasTienda[]>('/garzon/dashboard/ventas-tienda', {
            session,
            stid,
        });
    },

    /**
     * Obtener top clientes
     */
    getTopClientes: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopCliente[]> => {
        return post<TopCliente[]>('/garzon/dashboard/top-clientes', {
            session,
            stid,
        });
    },

    /**
     * Obtener top pagos
     */
    getTopPagos: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopPago[]> => {
        return post<TopPago[]>('/garzon/dashboard/top-pagos', {
            session,
            stid,
        });
    },

    /**
     * Obtener top productos
     */
    getTopProductos: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<TopProducto[]> => {
        return post<TopProducto[]>('/garzon/dashboard/top-productos', {
            session,
            stid,
        });
    },

    /**
     * Obtener ventas por departamento
     */
    getVentasPorDepartamento: async (
        session: GarzonSession,
        stid: number = 0
    ): Promise<VentasDepartamento[]> => {
        return post<VentasDepartamento[]>('/garzon/dashboard/ventas-departamento', {
            session,
            stid,
        });
    },
};

export { ApiError };

