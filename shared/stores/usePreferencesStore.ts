import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type Prefs = {
  sounds: boolean;
  haptics: boolean;
  loading: boolean;
  load: () => Promise<void>;
  setSounds: (v: boolean) => Promise<void>;
  setHaptics: (v: boolean) => Promise<void>;
};

const STORAGE_KEY = 'user_prefs_sound_haptics_v1';

export const usePreferencesStore = create<Prefs>((set, get) => ({
  sounds: true,
  haptics: true,
  loading: true,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ sounds: !!parsed.sounds, haptics: !!parsed.haptics, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },
  setSounds: async (v: boolean) => {
    set({ sounds: v });
    try {
      const cur = { sounds: v, haptics: get().haptics };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (e) {
      // ignore
    }
  },
  setHaptics: async (v: boolean) => {
    set({ haptics: v });
    try {
      const cur = { sounds: get().sounds, haptics: v };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (e) {
      // ignore
    }
  },
}));
