import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { TransactionItem } from "../entities/TransactionItem";
import { secureFetch } from "../http/secureFetch";
import { offlineQueue } from "../offline/offlineQueue";
import { dataCache, CACHE_KEYS } from "../offline/dataCache";
import { isOnline } from "../offline/networkUtils";
import { useSessionStore } from "./useSessionStore";
import { useToastStore } from "./useToastStore";

interface Tasas {
    fuente: string;
    nombre: string;
    compra: number | null;
    venta: number | null;
    promedio: number;
    fechaActualizacion: string;
}

interface WalletStore {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    transactions: TransactionItem[];
    setTransactions: (
        transactions: TransactionItem[] | ((prev: TransactionItem[]) => TransactionItem[])
    ) => void;
    previewTransactions: TransactionItem[];
    setPreviewTransactions: (transactions: TransactionItem[]) => void;
    paginationTransactions: {
        cursor: string | null;
        take: number;
        isEnd: boolean;
    };
    setPaginationTransactions: (pagination: {
        cursor: string | null;
        take: number;
        isEnd: boolean;
    }) => void;

    addTransaction: (
        transaction: Omit<TransactionItem, 'id' | 'issued_at'>
    ) => Promise<TransactionItem | undefined>;
    getHistoryTransactions: (
        account_id: string,
        user_id?: string,
        options?: {
            refresh?: boolean;
            types?: string;
            deleted?: boolean;
            startDate?: string;
            endDate?: string;
            tags?: string;
        }
    ) => Promise<void>;
    getPreviewTransactions: (account_id: string, user_id?: string) => Promise<void>;
    completePendingTransaction: (id: string, type: 'saving' | 'expense') => Promise<boolean>;
    deleteTransaction: (id: string) => Promise<boolean>;
    restoreTransaction: (id: string) => Promise<boolean>;
    logoutWallet: () => void;
    clearStore: () => void;

    tasas: Tasas[];
    setTasas: (tasas: Tasas[]) => void;
    getTasas: () => Promise<void>;
}

const CACHE_KEY_TRANSACTIONS = (accountId: string) => `@cache_transactions_${accountId}`;

export const useWalletStore = create<WalletStore>((set, get) => ({
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
    error: null,
    setError: (error: string | null) => set({ error }),

    transactions: [],
    setTransactions: (transactionsOrUpdater) => {
        if (typeof transactionsOrUpdater === 'function') {
            set((state) => ({
                transactions: (transactionsOrUpdater as any)(state.transactions),
            }));
        } else {
            set({ transactions: transactionsOrUpdater });
        }
    },

    previewTransactions: [],
    setPreviewTransactions: (transactions: TransactionItem[]) =>
        set({ previewTransactions: transactions }),

    paginationTransactions: {
        cursor: null,
        take: 10,
        isEnd: false,
    },
    setPaginationTransactions: (pagination) => set({ paginationTransactions: pagination }),

    tasas: [] as Tasas[],
    setTasas: (tasas: Tasas[]) => set({ tasas: tasas }),

    getTasas: async (): Promise<void> => {
        try {
            const response = await fetch('https://ve.dolarapi.com/v1/dolares');
            if (!response.ok) {
                set({ error: 'Failed to fetch rates' });
                return;
            }
            const data: Tasas[] = await response.json();
            set({ error: null, tasas: data });
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to fetch rates' });
        }
    },

    addTransaction: async (transaction) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) {
            get().setError('No active session');
            return undefined;
        }

        get().setLoading(true);
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<TransactionItem>({
                    url: `${MALET_API_URL}/transactions/save`,
                    method: 'POST',
                    body: transaction,
                });
                if (error || !response) throw new Error(error ?? 'Error creating transaction');

                if (transaction.tag_ids && transaction.tag_ids.length > 0) {
                    await secureFetch({
                        url: `${MALET_API_URL}/tags/transactions/${response.id}`,
                        method: 'POST',
                        body: { tagIds: transaction.tag_ids },
                    });
                }

                get().setError(null);
                get().setLoading(false);
                useToastStore
                    .getState()
                    .add({ type: 'success', message: 'Transacción creada con éxito', duration: 3000 });
                get().setTransactions((prev) => [response, ...prev]);
                get().setPreviewTransactions([response, ...get().previewTransactions]);
                return response;
            } else {
                const offlineId = 'offline_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
                const offlineTx: TransactionItem = {
                    id: offlineId,
                    index_id: Date.now(),
                    name: transaction.name,
                    amount: String(transaction.amount),
                    type: transaction.type as any,
                    account_id: transaction.account_id,
                    currency_code: transaction.currency_code,
                    tag_ids: transaction.tag_ids,
                    issued_at: new Date(),
                };
                await offlineQueue.enqueue({
                    entityType: 'transactions',
                    action: 'create',
                    payload: { ...transaction, user_id: userId },
                });
                get().setError(null);
                get().setLoading(false);
                useToastStore
                    .getState()
                    .add({ type: 'info', message: 'Transacción guardada sin conexión', duration: 3000 });
                get().setTransactions((prev) => [offlineTx, ...prev]);
                get().setPreviewTransactions([offlineTx, ...get().previewTransactions]);
                return offlineTx;
            }
        } catch (e: any) {
            get().setError(e?.message ?? 'Error creando transacción');
            get().setLoading(false);
            return undefined;
        }
    },

    getHistoryTransactions: async (account_id, _user_id = '', options = {}) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) return;

        const { refresh = false, types, startDate, endDate } = options;
        const state = get();

        if (state.loading) return;
        if (state.paginationTransactions.isEnd && !refresh) return;

        set({ loading: true, error: null });

        try {
            if (await isOnline()) {
                const take = state.paginationTransactions.take;
                const cursor = refresh ? null : state.paginationTransactions.cursor;

                let url = `${MALET_API_URL}/transactions/history?take=${take}&account_id=${account_id}&user_id=${userId}`;
                if (cursor) url += `&cursor=${cursor}`;
                if (types) url += `&types=${types}`;
                if (startDate) url += `&startDate=${startDate}`;
                if (endDate) url += `&endDate=${endDate}`;

                const { error, response } = await secureFetch<{ data: TransactionItem[]; nextCursor: string | null }>({
                    url,
                    method: 'GET',
                });

                if (error || !response) throw new Error(error ?? 'Failed to fetch transactions');

                const isEnd = response.nextCursor === null || response.data.length === 0;

                if (refresh) {
                    set({
                        transactions: response.data,
                        paginationTransactions: { cursor: response.nextCursor, take, isEnd },
                        loading: false, error: null,
                    });
                } else {
                    set({
                        transactions: [...state.transactions, ...response.data],
                        paginationTransactions: { cursor: response.nextCursor, take, isEnd },
                        loading: false, error: null,
                    });
                }
                await dataCache.set(CACHE_KEY_TRANSACTIONS(account_id), get().transactions);
            } else {
                const cached = await dataCache.get<TransactionItem[]>(CACHE_KEY_TRANSACTIONS(account_id));
                set({ transactions: cached ?? [], loading: false, error: null });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to fetch transactions', loading: false });
        }
    },

    getPreviewTransactions: async (account_id: string) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) return;

        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<{ data: TransactionItem[]; nextCursor: string | null }>({
                    url: `${MALET_API_URL}/transactions/history?take=3&account_id=${account_id}&user_id=${userId}`,
                    method: 'GET',
                });
                if (error || !response) throw new Error(error ?? 'Failed to fetch preview');
                set({ previewTransactions: response.data ?? [] });
                await dataCache.set(CACHE_KEYS.TRANSACTIONS_PREVIEW(account_id), response.data ?? []);
            } else {
                const cached = await dataCache.get<TransactionItem[]>(CACHE_KEYS.TRANSACTIONS_PREVIEW(account_id));
                if (cached) set({ previewTransactions: cached });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to fetch preview transactions' });
        }
    },

    completePendingTransaction: async (id: string, type: 'saving' | 'expense') => {
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<TransactionItem>({
                    url: `${MALET_API_URL}/transactions/complete/${id}`,
                    method: 'PUT',
                    body: { type },
                });
                if (error || !response) throw new Error(error ?? 'Failed to complete transaction');
            } else {
                await offlineQueue.enqueue({
                    entityType: 'transactions',
                    action: 'update',
                    payload: { id, type, completed: true },
                });
            }

            set((s) => ({
                transactions: s.transactions.map((t) =>
                    t.id === id ? { ...t, type, pending_balance: undefined } : t
                ),
                previewTransactions: s.previewTransactions.map((t) =>
                    t.id === id ? { ...t, type, pending_balance: undefined } : t
                ),
            }));
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to complete transaction' });
            return false;
        }
    },

    deleteTransaction: async (id: string) => {
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: `${MALET_API_URL}/transactions/${id}`,
                    method: 'DELETE',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'transactions',
                    action: 'delete',
                    payload: { id },
                });
            }

            set((s) => ({
                transactions: s.transactions.filter((t) => String(t.index_id) !== id),
                previewTransactions: s.previewTransactions.filter((t) => String(t.index_id) !== id),
            }));
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to delete transaction' });
            return false;
        }
    },

    restoreTransaction: async (id: string) => {
        try {
            let restoredTx: TransactionItem | null = null;
            if (await isOnline()) {
                const { error, response } = await secureFetch<TransactionItem>({
                    url: `${MALET_API_URL}/transactions/${id}/restore`,
                    method: 'PUT',
                });
                if (error) throw new Error(error);
                restoredTx = response;
            } else {
                await offlineQueue.enqueue({
                    entityType: 'transactions',
                    action: 'update',
                    payload: { id, restored: true },
                });
            }

            if (restoredTx) {
                set((s) => ({
                    transactions: [restoredTx, ...s.transactions],
                    previewTransactions: [restoredTx, ...s.previewTransactions],
                }));
            }
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to restore transaction' });
            return false;
        }
    },

    logoutWallet: () => {
        set({
            error: null,
            transactions: [],
            previewTransactions: [],
            paginationTransactions: { cursor: null, take: 10, isEnd: false },
        });
    },

    clearStore: () => {
        set({
            loading: false,
            error: null,
            transactions: [],
            previewTransactions: [],
            paginationTransactions: { cursor: null, take: 10, isEnd: false },
        });
    },
}));
