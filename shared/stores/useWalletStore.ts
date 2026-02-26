import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { TransactionItem } from "../entities/TransactionItem";
import { secureFetch } from "../http/secureFetch";

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
    setTransactions: (transactions: TransactionItem[] | ((prev: TransactionItem[]) => TransactionItem[])) => void;
    previewTransactions: TransactionItem[];
    setPreviewTransactions: (transactions: TransactionItem[]) => void;
    paginationTransactions: {
        cursor: string | null;
        take: number;
        isEnd: boolean;
    };
    setPaginationTransactions: (pagination: { cursor: string | null; take: number; isEnd: boolean }) => void;
    addTransaction: (transaction: Omit<TransactionItem, 'id' | 'issued_at'>) => Promise<TransactionItem | undefined>;
    getHistoryTransactions: (account_id: string, user_id?: string, options?: { refresh?: boolean, types?: string, startDate?: string, endDate?: string }) => Promise<void>;
    getPreviewTransactions: (account_id: string, user_id?: string) => Promise<void>;
    completePendingTransaction: (id: string, type: 'saving' | 'expense') => Promise<boolean>;
    logoutWallet: () => void;
    clearStore: () => void;

    // Tasas de cambio u.u
    tasas: Tasas[];
    setTasas: (tasas: Tasas[]) => void;
    getTasas: () => Promise<void>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
    error: null,
    setError: (error: string | null) => set({ error }),
    transactions: [],
    setTransactions: (transactionsOrUpdater) => {
        if (typeof transactionsOrUpdater === 'function') {
            set((state) => ({
                transactions: transactionsOrUpdater(state.transactions)
            }));
        } else {
            set({ transactions: transactionsOrUpdater });
        }
    },
    previewTransactions: [],
    setPreviewTransactions: (transactions: TransactionItem[]) => set({ previewTransactions: transactions }),

    paginationTransactions: {
        cursor: null,
        take: 10,
        isEnd: false,
    },
    setPaginationTransactions: (pagination) => set({ paginationTransactions: pagination }),

    tasas: [] as Tasas[],
    setTasas: (tasas: Tasas[]) => set({ tasas: tasas }),

    getTasas: async (): Promise<void> => {
        const { error, response } = await secureFetch<Tasas[]>({
            url: `https://ve.dolarapi.com/v1/dolares`,
            method: 'GET',
            setLoading: get().setLoading,
        });

        if (error || !response) {
            set({ error: error || 'Failed to fetch rates' })
            return;
        }

        set({ error: null, tasas: response })
    },

    addTransaction: async (transaction): Promise<TransactionItem | undefined> => {
        const { error, response } = await secureFetch<TransactionItem>({
            url: `${MALET_API_URL}/transactions/save`,
            method: 'POST',
            body: transaction,
            setLoading: get().setLoading,
        });

        if (error) {
            get().setError(error);
            return undefined;
        }

        if (!response) {
            return undefined;
        }

        get().setError(null);

        get().setPreviewTransactions([response, ...get().previewTransactions]);
        return response;
    },

    getHistoryTransactions: async (account_id, user_id = '', options = {}) => {
        const { refresh = false, types, startDate, endDate } = options;
        const state = get();
        const { setLoading, setError, paginationTransactions, transactions } = state;

        if (state.loading) return;
        if (state.paginationTransactions.isEnd && !refresh) return;

        const take = paginationTransactions.take;
        const cursor = refresh ? null : paginationTransactions.cursor;

        let url = `${MALET_API_URL}/transactions/history?take=${take}&account_id=${account_id}&user_id=${user_id}`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }
        if (types) {
            url += `&types=${types}`;
        }
        if (startDate) {
            url += `&startDate=${startDate}`;
        }
        if (endDate) {
            url += `&endDate=${endDate}`;
        }

        const { error, response } = await secureFetch<{ data: TransactionItem[]; nextCursor: string | null }>({
            url,
            method: 'GET',
            setLoading: setLoading,
        });

        if (error || !response) {
            setError(error || 'Failed to fetch transactions');
            return;
        }

        setError(null);

        const isEnd = response.nextCursor === null || response.data.length === 0;

        if (refresh) {
            set({
                transactions: response.data,
                paginationTransactions: {
                    cursor: response.nextCursor,
                    take,
                    isEnd,
                },
            });
        } else {
            const newTransactions = [...transactions, ...response.data];
            set({
                transactions: newTransactions,
                paginationTransactions: {
                    cursor: response.nextCursor,
                    take,
                    isEnd,
                },
            });
        }
    },

    getPreviewTransactions: async (account_id: string, user_id = '') => {
        const { setLoading, setError, setPreviewTransactions } = get();

        const endpoint = `/transactions/history?take=${10}&account_id=${account_id}&user_id=${user_id}`;
        const { error, response } = await secureFetch<{ data: TransactionItem[]; nextCursor: string | null }>({
            url: `${MALET_API_URL}${endpoint}`,
            method: 'GET',
            setLoading: setLoading,
        });

        if (error || !response) {
            setError(error || 'Failed to fetch preview transactions');
            return;
        }

        setError(null);
        setPreviewTransactions(response.data || []);
    },

    completePendingTransaction: async (id: string, type: 'saving' | 'expense'): Promise<boolean> => {
        const { error, response } = await secureFetch<TransactionItem>({
            url: `${MALET_API_URL}/transactions/complete/${id}`,
            method: 'PUT',
            body: { type },
            setLoading: get().setLoading,
        });

        if (error || !response) {
            get().setError(error || 'Failed to complete transaction');
            return false;
        }

        get().setError(null);

        // Update local list substituting the new finalized item for UI reactivity
        const updatedTransactions = get().transactions.map(t =>
            t.id.toString() === id.toString() ? response : t
        );
        get().setTransactions(updatedTransactions);

        const updatedPreview = get().previewTransactions.map(t =>
            t.id.toString() === id.toString() ? response : t
        );
        get().setPreviewTransactions(updatedPreview);

        return true;
    },

    logoutWallet: () => {
        set({
            error: null,
            transactions: [],
            previewTransactions: [],
            paginationTransactions: {
                cursor: null,
                take: 10,
                isEnd: false,
            },
        })
    },

    clearStore: () => {
        set({
            loading: false,
            error: null,
            transactions: [],
            previewTransactions: [],
            paginationTransactions: {
                cursor: null,
                take: 10,
                isEnd: false,
            },
        })
    }
}));

