import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { ShoppingItem } from '../entities/ShoppingItem';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

interface ShoppingListState {
    items: ShoppingItem[];
    loaded: boolean;
    fabX: number;
    fabY: number;
    load: () => Promise<void>;
    addItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateItem: (id: string, updates: Partial<Omit<ShoppingItem, 'id' | 'createdAt'>>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    togglePurchased: (id: string) => Promise<void>;
    clearPurchased: () => Promise<void>;
    setFabPosition: (x: number, y: number) => Promise<void>;
}

const STORAGE_KEY = '@malet_shopping_list';

const saveToStorage = async (items: ShoppingItem[], fabX = 0, fabY = 0) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, fabX, fabY, updatedAt: new Date().toISOString() }));
};

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
    items: [],
    loaded: false,
    fabX: -999,
    fabY: -999,

    load: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                set({
                    items: parsed.items || [],
                    fabX: parsed.fabX ?? -999,
                    fabY: parsed.fabY ?? -999,
                    loaded: true,
                });
            } else {
                set({ loaded: true });
            }
        } catch {
            set({ loaded: true });
        }
    },

    addItem: async (item) => {
        const now = new Date().toISOString();
        const newItem: ShoppingItem = {
            ...item,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        const items = [...get().items, newItem];
        set({ items });
        await saveToStorage(items, get().fabX, get().fabY);
    },

    updateItem: async (id, updates) => {
        const items = get().items.map(i =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
        );
        set({ items });
        await saveToStorage(items, get().fabX, get().fabY);
    },

    removeItem: async (id) => {
        const items = get().items.filter(i => i.id !== id);
        set({ items });
        await saveToStorage(items, get().fabX, get().fabY);
    },

    togglePurchased: async (id) => {
        const items = get().items.map(i =>
            i.id === id ? { ...i, purchased: !i.purchased, updatedAt: new Date().toISOString() } : i
        );
        set({ items });
        await saveToStorage(items, get().fabX, get().fabY);
    },

    clearPurchased: async () => {
        const items = get().items.filter(i => !i.purchased);
        set({ items });
        await saveToStorage(items, get().fabX, get().fabY);
    },

    setFabPosition: async (x, y) => {
        set({ fabX: x, fabY: y });
        await saveToStorage(get().items, x, y);
    },
}));
