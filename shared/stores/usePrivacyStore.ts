import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'privacy.transactionsHidden';

interface PrivacyStore {
    /** Oculta nombre, monto y etiquetas de las transacciones. */
    transactionsHidden: boolean;
    hydrated: boolean;
    hydrate: () => Promise<void>;
    toggleTransactionsHidden: () => Promise<void>;
}

/** Preferencia local del dispositivo. No se envía al backend. */
export const usePrivacyStore = create<PrivacyStore>((set, get) => ({
    transactionsHidden: false,
    hydrated: false,

    hydrate: async () => {
        if (get().hydrated) return;
        try {
            const value = await AsyncStorage.getItem(STORAGE_KEY);
            set({
                transactionsHidden: value === 'true',
                hydrated: true,
            });
        } catch {
            set({ hydrated: true });
        }
    },

    toggleTransactionsHidden: async () => {
        const next = !get().transactionsHidden;
        set({ transactionsHidden: next });

        try {
            await AsyncStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
        } catch {
            set({ transactionsHidden: !next });
        }
    },
}));
