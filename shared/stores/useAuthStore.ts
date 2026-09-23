import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { UserPrimitives } from "../entities/User";
import { secureFetch } from "../http/secureFetch";
import { dataCache, CACHE_KEYS } from "../offline/dataCache";
import { BiometricService } from "../services/auth/biometric.service";
import { useAccountStore } from "./useAccountStore";
import { useSessionStore } from "./useSessionStore";
import { useSharedAccountStore } from "./useSharedAccountStore";
import { useShoppingListStore } from "./useShoppingListStore";
import { useTagStore } from "./useTagStore";
import { useToastStore } from "./useToastStore";
import { useWalletStore } from "./useWalletStore";

interface LoginResponse {
    access_token: string;
    user: UserPrimitives;
}

interface AuthStore {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    token: string | null;
    setToken: (token: string | null) => void;
    user: UserPrimitives;
    setUser: (user: UserPrimitives) => void;
    isBiometricAuthenticated: boolean;
    setBiometricAuthenticated: (value: boolean) => void;

    // Auth methods
    register: (user: Pick<UserPrimitives, 'name' | 'username' | 'email' | 'password'>) => Promise<boolean>;
    login: (credentials: { email: string; password: string }) => Promise<boolean>;
    loginWithGoogle: (token: string) => Promise<boolean>;
    loginWithBiometrics: () => Promise<boolean>;
    logout: () => Promise<boolean>;
    verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
    error: null,
    setError: (error: string | null) => set({ error }),
    token: null,
    setToken: (token: string | null) => set({ token }),
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
    isBiometricAuthenticated: false,
    setBiometricAuthenticated: (value: boolean) => set({ isBiometricAuthenticated: value }),

    register: async (user: Pick<UserPrimitives, 'name' | 'username' | 'email' | 'password'>) => {
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

        await AsyncStorage.setItem('token', response.access_token);
        get().setToken(response.access_token);
        get().setUser(response.user);
        get().setError(null);
        get().setBiometricAuthenticated(true);

        await BiometricService.askBiometricPermissionAndSave(response.access_token);

        // Cache user for offline access
        await dataCache.set(CACHE_KEYS.USER, response.user);

        // Activate the session
        await useSessionStore.getState().login({
            userId: response.user.id,
            token: response.access_token,
            hasSyncSubscription: true,
        });

        return true;
    },

    loginWithGoogle: async (token: string) => {
        const { error, response } = await secureFetch<LoginResponse>({
            url: MALET_API_URL + '/auth/google/mobile',
            method: 'POST',
            body: { idToken: token },
            setLoading: get().setLoading,
        })

        if (error || !response) {
            get().setError(error ?? 'Error al iniciar sesión con Google');
            return false;
        }

        await AsyncStorage.setItem('token', response.access_token);
        get().setToken(response.access_token);
        get().setUser(response.user);
        get().setError(null);
        get().setBiometricAuthenticated(true);

        await BiometricService.askBiometricPermissionAndSave(response.access_token);

        // Cache user for offline access
        await dataCache.set(CACHE_KEYS.USER, response.user);

        // Activate the session
        await useSessionStore.getState().login({
            userId: response.user.id,
            token: response.access_token,
            hasSyncSubscription: true,
        });

        return true;
    },

    logout: async () => {
        try {
            await useSessionStore.getState().logout();
            await useAccountStore.getState().logoutAccount();
            useWalletStore.getState().logoutWallet();
            useTagStore.setState({ tags: [] });
            useSharedAccountStore.getState().logoutSharedAccount();
            useShoppingListStore.setState({ items: [], loaded: false });
        } catch (e) {
            console.error('[auth.logout] cleanup failed:', e);
        }

        await AsyncStorage.removeItem('token');
        await BiometricService.clearStoredToken();
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
            token: null,
            error: null,
            isBiometricAuthenticated: false
        });
        return true;
    },

    loginWithBiometrics: async () => {
        const supported = await BiometricService.isSupported();
        if (!supported) {
            get().setError('La biometría no está disponible');
            return false;
        }

        const savedToken = await BiometricService.getStoredToken();
        if (!savedToken) {
            get().setError('Inicia sesión normalmente primero');
            return false;
        }

        const success = await BiometricService.authenticate();
        if (!success) return false;

        get().setLoading(true);
        await AsyncStorage.setItem('token', savedToken);
        get().setToken(savedToken);
        get().setBiometricAuthenticated(true);

        const isValid = await get().verifySession();
        get().setLoading(false);

        if (!isValid) {
            get().setError('Sesión expirada');
            await BiometricService.clearStoredToken();
            return false;
        }

        return true;
    },

    verifySession: async () => {
        let token = await AsyncStorage.getItem('token');
        if (!token) {
            return false;
        }

        const { isBiometricAuthenticated, setBiometricAuthenticated } = get();

        if (!isBiometricAuthenticated) {
            const isSupported = await BiometricService.isSupported();
            const hasStoredToken = await BiometricService.hasStoredToken();

            if (isSupported && hasStoredToken) {
                const authenticated = await BiometricService.authenticate();
                if (!authenticated) {
                    return false;
                }

                setBiometricAuthenticated(true);
                const bioToken = await BiometricService.getStoredToken();
                if (bioToken) {
                    token = bioToken;
                    await AsyncStorage.setItem('token', token);
                }
            }
        }

        // Check connectivity before verifying with the server
        const netState = await NetInfo.fetch();
        const isOffline = !netState.isConnected || netState.isInternetReachable === false;

        if (isOffline) {
            // Offline: trust the locally cached session
            const sessionState = useSessionStore.getState();
            if (sessionState.currentUserId && sessionState.token) {
                const cachedUser = await dataCache.get<UserPrimitives>(CACHE_KEYS.USER);
                if (cachedUser) {
                    set({ user: cachedUser });
                }
                set({
                    token,
                    error: null,
                    isBiometricAuthenticated: true,
                });
                useToastStore.getState().add({
                    type: 'info',
                    message: 'Sin conexión — usando datos locales',
                    duration: 3000,
                });
                return true;
            }
            return false;
        }

        const { error, response } = await secureFetch<UserPrimitives>({
            url: MALET_API_URL + '/auth/verify',
            method: 'GET',
            setLoading: get().setLoading,
        })

        if (error || !response) {
            await AsyncStorage.removeItem('token');
            set({
                token: null,
                error: error ?? 'Error al verificar sesión'
            });
            return false;
        }

        set({
            token,
            error: null,
            user: response,
            isBiometricAuthenticated: true
        })

        // Cache user for offline access
        await dataCache.set(CACHE_KEYS.USER, response);

        // Update session
        await useSessionStore.getState().login({
            userId: response.id,
            token,
            hasSyncSubscription: true,
        });

        return true;
    }

}))
