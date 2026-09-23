import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@cache_';

export const CACHE_KEYS = {
    ACCOUNTS: `${CACHE_PREFIX}accounts`,
    DELETED_ACCOUNTS: `${CACHE_PREFIX}deleted_accounts`,
    TAGS: `${CACHE_PREFIX}tags`,
    TRANSACTIONS_PREVIEW: (accountId: string) => `${CACHE_PREFIX}transactions_preview_${accountId}`,
    SHARED_ACCOUNTS: `${CACHE_PREFIX}shared_accounts`,
    USER: `${CACHE_PREFIX}user`,
    SESSION: `${CACHE_PREFIX}session`,
} as const;

export const dataCache = {
    set: async (key: string, data: any): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('[dataCache] Failed to set', key, e);
        }
    },

    get: async <T>(key: string): Promise<T | null> => {
        try {
            const raw = await AsyncStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('[dataCache] Failed to get', key, e);
            return null;
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.warn('[dataCache] Failed to remove', key, e);
        }
    },

    clearAll: async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
        } catch (e) {
            console.warn('[dataCache] Failed to clearAll', e);
        }
    },
};
