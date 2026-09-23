import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SESSION_KEY = '@active_session';

interface StoredSession {
    userId: string;
    token?: string;
    hasSyncSubscription: boolean;
}

interface SessionState {
    currentUserId: string | null;
    token: string | null;
    hasSyncSubscription: boolean;
    hydrated: boolean;

    hydrate: () => Promise<void>;
    login: (params: {
        userId: string;
        token?: string;
        hasSyncSubscription: boolean;
    }) => Promise<void>;
    logout: () => Promise<void>;
    setSubscription: (hasSub: boolean) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
    currentUserId: null,
    token: null,
    hasSyncSubscription: true,
    hydrated: false,

    hydrate: async () => {
        try {
            const raw = await AsyncStorage.getItem(SESSION_KEY);
            if (raw) {
                const stored: StoredSession = JSON.parse(raw);
                set({
                    currentUserId: stored.userId,
                    token: stored.token ?? null,
                    hasSyncSubscription: stored.hasSyncSubscription,
                    hydrated: true,
                });
            } else {
                set({ hydrated: true });
            }
        } catch {
            set({ hydrated: true });
        }
    },

    login: async ({ userId, token, hasSyncSubscription }) => {
        const session: StoredSession = {
            userId,
            token,
            hasSyncSubscription,
        };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        set({
            currentUserId: userId,
            token: token ?? null,
            hasSyncSubscription,
        });
    },

    logout: async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        set({
            currentUserId: null,
            token: null,
            hasSyncSubscription: false,
        });
    },

    setSubscription: async (hasSub) => {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
            const stored: StoredSession = JSON.parse(raw);
            stored.hasSyncSubscription = hasSub;
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(stored));
        }
        set({ hasSyncSubscription: hasSub });
    },
}));
