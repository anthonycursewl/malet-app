import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type Prefs = {
  sounds: boolean;
  haptics: boolean;
  loading: boolean;
  load: () => Promise<void>;
  setSounds: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
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
  setSounds: (v: boolean) => {
    set({ sounds: v });
    try {
      const cur = { sounds: v, haptics: get().haptics };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (e) {
      // ignore
    }
  },
  setHaptics: (v: boolean) => {
    set({ haptics: v });
    try {
      const cur = { sounds: get().sounds, haptics: v };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (e) {
      // ignore
    }
  },
}));
