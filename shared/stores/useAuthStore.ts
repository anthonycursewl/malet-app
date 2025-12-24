import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { UserPrimitives } from "../entities/User";
import { secureFetch } from "../http/secureFetch";

interface LoginResponse {
    access_token: string;
    user: UserPrimitives;
}

interface AuthStore {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    user: UserPrimitives;
    setUser: (user: UserPrimitives) => void;

    // Auth methods
    register: (user: Omit<UserPrimitives, 'id' | 'role' | 'created_at'>) => Promise<boolean>;
    login: (credentials: { email: string; password: string }) => Promise<boolean>;
    logout: () => Promise<boolean>;
    verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
    error: null,
    setError: (error: string | null) => set({ error }),
    user: {
        id: '',
        name: '',
        username: '',
        email: '',
        created_at: new Date(),
        password: '',
        verified: false,
        verification_type_id: null,
        verification_type: null,

    },
    setUser: (user: UserPrimitives) => set({ user }),

    register: async (user: Omit<UserPrimitives, 'id' | 'role' | 'created_at'>) => {
        const { error } = await secureFetch({
            url: MALET_API_URL + '/users/save',
            method: 'POST',
            body: user,
            setLoading: get().setLoading,
        })

        if (error) {
            get().setError(error);
            return false;
        }

        get().setError(null);
        return true;
    },

    login: async (credentials: { email: string; password: string }) => {
        const { error, response } = await secureFetch<LoginResponse>({
            url: MALET_API_URL + '/users/login',
            method: 'POST',
            body: credentials,
            setLoading: get().setLoading,
        })

        if (error || !response) {
            get().setError(error ?? 'Error al iniciar sesión');
            return false;
        }

        // Esperar a que el token se guarde antes de continuar
        await AsyncStorage.setItem('token', response.access_token);
        get().setUser(response.user);
        get().setError(null);

        return true;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        set({
            user: {
                id: '',
                name: '',
                username: '',
                email: '',
                created_at: new Date(),
                password: '',
                verified: false,
                verification_type_id: null,
                verification_type: null,
            },
            error: null
        });
        return true;
    },

    verifySession: async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            return false;
        }

        const { error, response } = await secureFetch<UserPrimitives>({
            url: MALET_API_URL + '/auth/verify',
            method: 'GET',
            setLoading: get().setLoading,
        })

        if (error || !response) {
            await AsyncStorage.removeItem('token');
            set({ error: error ?? 'Error al verificar sesión' });
            return false;
        }

        set({
            error: null,
            user: response
        })
        return true;
    }

}))