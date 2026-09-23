import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { ShoppingItem } from '../entities/ShoppingItem';
import { MALET_API_URL } from '../config/malet.config';
import { secureFetch } from '../http/secureFetch';
import { useAccountStore } from './useAccountStore';
import { useSessionStore } from './useSessionStore';
import { useWalletStore } from './useWalletStore';

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
    convertToTransaction: (accountId: string) => Promise<{
        transactionId: string;
        total: number;
        currency: string;
        archivedItemCount: number;
    } | null>;
}

const STORAGE_KEY = '@malet_shopping_list';
const FAB_STORAGE_KEY = '@malet_shopping_fab';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const saveToStorage = async (items: ShoppingItem[], fabX = 0, fabY = 0) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, fabX, fabY, updatedAt: new Date().toISOString() }));
};

const loadFabPosition = async (): Promise<{ x: number; y: number }> => {
    try {
        const raw = await AsyncStorage.getItem(FAB_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { x: parsed.x ?? -999, y: parsed.y ?? -999 };
        }
    } catch { }
    return { x: -999, y: -999 };
};

const saveFabPosition = async (x: number, y: number) => {
    await AsyncStorage.setItem(FAB_STORAGE_KEY, JSON.stringify({ x, y }));
};

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
    items: [],
    loaded: false,
    fabX: -999,
    fabY: -999,

    load: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const fab = await loadFabPosition();
            if (raw) {
                const parsed = JSON.parse(raw);
                set({
                    items: parsed.items || [],
                    fabX: parsed.fabX ?? fab.x,
                    fabY: parsed.fabY ?? fab.y,
                    loaded: true,
                });
            } else {
                set({ fabX: fab.x, fabY: fab.y, loaded: true });
            }
        } catch {
            set({ loaded: true });
        }
    },

    addItem: async (item) => {
        const existing = get().items;
        const listCurrency = existing.length > 0 ? existing[0].currency : item.currency;
        const now = new Date().toISOString();
        const newItem: ShoppingItem = {
            ...item,
            currency: listCurrency,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        const items = [...existing, newItem];
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
        await saveFabPosition(x, y);
    },

    convertToTransaction: async (accountId) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) return null;

        const purchased = get().items.filter((i) => i.purchased);
        if (purchased.length === 0) return null;

        const total = purchased.reduce((sum, i) => sum + (i.estimatedPrice ?? 0) * (i.quantity ?? 1), 0);
        const currency = purchased.find((i) => i.currency)?.currency ?? 'USD';
        const name = purchased.map((i) => i.name).join(', ').slice(0, 255);

        try {
            const { error, response } = await secureFetch<any>({
                url: `${MALET_API_URL}/transactions/save`,
                method: 'POST',
                body: {
                    account_id: accountId,
                    name: `Lista de compras: ${name}`,
                    amount: total,
                    type: 'expense',
                    currency_code: currency,
                    description: `Convertido desde lista de compras (${purchased.length} artículos)`,
                },
            });

            if (error || !response) throw new Error(error ?? 'Error creating transaction');

            // Update wallet store
            useWalletStore.getState().setTransactions((prev) => [response, ...prev]);
            useWalletStore.getState().setPreviewTransactions([response, ...useWalletStore.getState().previewTransactions]);

            // Update account balance in memory
            useAccountStore.getState().updateBalanceInMemory(accountId, total, 'expense');

            // Remove purchased items
            const remaining = get().items.filter((i) => !i.purchased);
            set({ items: remaining });
            await saveToStorage(remaining, get().fabX, get().fabY);

            return {
                transactionId: response.id,
                total,
                currency,
                archivedItemCount: purchased.length,
            };
        } catch (e: any) {
            console.error('[shoppingList] convertToTransaction error', e);
            return null;
        }
    },
}));
