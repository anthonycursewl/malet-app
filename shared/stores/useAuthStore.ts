import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { UserPrimitives } from "../entities/User";
import { secureFetch } from "../http/secureFetch";

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
    },
    setUser: (user: UserPrimitives) => set({ user }),

    register: async (user: Omit<UserPrimitives, 'id' | 'role' | 'created_at'>) => {
        const { error } = await secureFetch({
            url: MALET_API_URL + '/users/save',
            method: 'POST',
            body: JSON.stringify(user),
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
        const { error, response } = await secureFetch({
            url: MALET_API_URL + '/users/login',
            method: 'POST',
            body: JSON.stringify(credentials),
            setLoading: get().setLoading,
        }) 

        if (error) {
            get().setError(error);
            return false;
        }

        AsyncStorage.setItem('token', response.access_token).then(() => {
            get().setUser(response.user);
            get().setError(null);
        });
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

        const { error, response } = await secureFetch({
            url: MALET_API_URL + '/auth/verify',
            method: 'GET',
            setLoading: get().setLoading,
        }) 

        if (error) {
            await AsyncStorage.removeItem('token');
            get().setError(error);
            return false;
        }

        get().setUser(response);
        set({
            error: null
        })
        return true;
    }
    
}))