import { create } from 'zustand';

interface AppStore {
  resetApp: () => Promise<void>;
  setState: (state: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  resetApp: async () => {},
  setState: (state) => set(typeof state === 'function' ? state : (s) => ({ ...s, ...state })),
}));
