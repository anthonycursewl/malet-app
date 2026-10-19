import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isSalesDatePreset, SalesDatePreset } from '../entities/SalesModule';

/** Rango con el que se abre Ventas cuando el usuario no ha guardado otro. */
export const DEFAULT_SALES_PRESET: SalesDatePreset = 'today';

/**
 * Preferencias locales del módulo de ventas: se guardan **solo en el
 * dispositivo** y por cuenta (cada usuario tiene la suya).
 */
interface SalesPreferencesStore {
    /** Rango por defecto con el que se abre la pestaña Ventas. */
    defaultPreset: SalesDatePreset;
    /** Cuenta a la que pertenece el valor en memoria (null = sin cargar). */
    loadedFor: string | null;
    loading: boolean;
    /**
     * Carga el rango guardado de esa cuenta (una sola lectura por sesión) y lo
     * devuelve. Si no hay nada guardado o el valor no es válido, usa el defecto.
     */
    load: (userId?: string | null) => Promise<SalesDatePreset>;
    /** Guarda el rango por defecto. Devuelve el error o `null` si todo fue bien. */
    setDefaultPreset: (
        preset: SalesDatePreset,
        userId?: string | null
    ) => Promise<string | null>;
}

const storageKey = (account: string) => `sales_default_preset_v1:${account}`;

/** Cuenta del almacenamiento: el usuario logueado o un valor genérico. */
const accountKey = (userId?: string | null) => userId ?? 'anon';

export const useSalesPreferencesStore = create<SalesPreferencesStore>((set, get) => ({
    defaultPreset: DEFAULT_SALES_PRESET,
    loadedFor: null,
    loading: false,

    load: async (userId) => {
        const account = accountKey(userId);
        if (get().loadedFor === account) {
            return get().defaultPreset;
        }

        set({ loading: true });

        try {
            const raw = await AsyncStorage.getItem(storageKey(account));
            const preset = isSalesDatePreset(raw) ? raw : DEFAULT_SALES_PRESET;
            set({ defaultPreset: preset, loadedFor: account, loading: false });
            return preset;
        } catch {
            set({
                defaultPreset: DEFAULT_SALES_PRESET,
                loadedFor: account,
                loading: false,
            });
            return DEFAULT_SALES_PRESET;
        }
    },

    setDefaultPreset: async (preset, userId) => {
        if (!isSalesDatePreset(preset)) {
            return 'Rango no válido.';
        }

        const account = accountKey(userId);
        set({ defaultPreset: preset, loadedFor: account });

        try {
            await AsyncStorage.setItem(storageKey(account), preset);
            return null;
        } catch {
            return 'No se pudo guardar la preferencia en este dispositivo.';
        }
    },
}));
