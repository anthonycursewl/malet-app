// stores/useGarzonStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { HttpError, getUserFriendlyMessage } from '../http/HttpError';
import {
    GarzonAuthState,
    GarzonCredentials,
    GarzonSession,
    GarzonUser
} from '../interfaces/garzon.interfaces';
import { garzonApi } from '../services/garzon/GarzonApi';

const STORAGE_KEY = '@garzon_session';

interface GarzonStore extends GarzonAuthState {
    login: (credentials: GarzonCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshDashboard: (stid?: number) => Promise<void>;
    restoreSession: () => Promise<void>;
    clearError: () => void;
}

export const useGarzonStore = create<GarzonStore>((set, get) => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    session: null,
    user: null,
    dashboardData: null,
    fetchedAt: null,

    /**
     * Login y obtener dashboard
     */
    login: async (credentials: GarzonCredentials) => {
        set({ isLoading: true, error: null });

        try {

            const response = await garzonApi.loginAndGetDashboard(
                credentials.username,
                credentials.password,
                0
            );

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                session: response.session,
                user: response.user,
            }));

            set({
                isAuthenticated: true,
                isLoading: false,
                session: response.session,
                user: response.user,
                dashboardData: response.dashboard,
                fetchedAt: response.fetchedAt,
                error: null,
            });

            return true;
        } catch (error) {
            const message = error instanceof HttpError
                ? getUserFriendlyMessage(error)
                : 'Error al conectar con el servidor';

            set({
                isLoading: false,
                error: message,
            });
            return false;
        }
    },

    /**
     * Cerrar sesión
     */
    logout: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);

        set({
            isAuthenticated: false,
            session: null,
            user: null,
            dashboardData: null,
            fetchedAt: null,
            error: null,
        });
    },

    /**
     * Refrescar datos del dashboard
     */
    refreshDashboard: async (stid: number = 0) => {
        const { isAuthenticated, session } = get();

        if (!isAuthenticated || !session) {
            set({ error: 'No hay sesión activa' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const dashboardData = await garzonApi.getDashboard(session, stid);

            set({
                dashboardData,
                fetchedAt: new Date().toISOString(),
                isLoading: false,
            });
        } catch (error) {
            if (error instanceof HttpError && error.status === 401) {
                await get().logout();
                set({
                    error: 'La sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: error instanceof HttpError
                        ? getUserFriendlyMessage(error)
                        : 'Error al actualizar los datos',
                });
            }
        }
    },

    /**
     * Restaurar sesión desde AsyncStorage (llamar al iniciar la app)
     */
    restoreSession: async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);

            if (storedData) {
                const { session, user }: { session: GarzonSession; user: GarzonUser } = JSON.parse(storedData);

                set({ isLoading: true });

                try {
                    const isValid = await garzonApi.verifySession(session);

                    if (isValid) {
                        set({ session, user, isAuthenticated: true });
                        await get().refreshDashboard();
                    } else {
                        await AsyncStorage.removeItem(STORAGE_KEY);
                        set({ isLoading: false });
                    }
                } catch {
                    set({
                        session,
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: 'No se pudo verificar la sesión. Intenta refrescar.',
                    });
                }
            }
        } catch (error) {
            console.error('Error restaurando sesión:', error);
        }
    },

    /**
     * Limpiar mensaje de error
     */
    clearError: () => {
        set({ error: null });
    },
}));
