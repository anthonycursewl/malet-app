import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => string;
  update: (id: string, patch: Partial<Omit<Toast, 'id'>>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast_${++counter}_${Date.now()}`;
    const entry: Toast = { ...toast, id, duration: toast.duration ?? 3000 };
    set((s) => ({ toasts: [...s.toasts, entry] }));
    return id;
  },
  update: (id, patch) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },
  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => set({ toasts: [] }),
}));
