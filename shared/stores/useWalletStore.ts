import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { TransactionItem } from "../entities/TransactionItem";
import { secureFetch } from "../http/secureFetch";

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
        skip: number;
        take: number;
        isEnd: boolean;
    };
    setPaginationTransactions: (pagination: { skip: number; take: number; isEnd: boolean }) => void;
    addTransaction: (transaction: Omit<TransactionItem, 'id' | 'issued_at'>) => Promise<TransactionItem | undefined>;
    getHistoryTransactions: (account_id: string, user_id?: string, options?: { refresh?: boolean }) => Promise<void>;
    getPreviewTransactions: (account_id: string, user_id?: string) => Promise<void>;
    logoutWallet: () => void;
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
        skip: 0,
        take: 10,
        isEnd: false,
    },
    setPaginationTransactions: (pagination) => set({ paginationTransactions: pagination }),
    
    addTransaction: async (transaction): Promise<TransactionItem | undefined> => {
        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}/transactions/save`,
            method: 'POST',
            body: JSON.stringify(transaction),
            setLoading: get().setLoading,
        });
            
        if (error) {
            get().setError(error);
            return undefined;
        }
            
        get().setError(null);
        
        get().setPreviewTransactions([response, ...get().previewTransactions]);
        return response
    },

    getHistoryTransactions: async (account_id, user_id = '', options = {}) => {
        const { refresh = false } = options;
        const state = get();
        const { setLoading, setError, paginationTransactions, transactions } = state;
        
        if (state.loading) return;
        if (state.paginationTransactions.isEnd && !refresh) return;
    
        const take = paginationTransactions.take;
        const skip = refresh ? 0 : paginationTransactions.skip;
    
        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}/transactions/history?skip=${skip}&take=${take}&account_id=${account_id}&user_id=${user_id}`,
            method: 'GET',
            setLoading: setLoading,
        });

        if (error) {
            setError(error);
            return;
        }
    
        setError(null);
    
        const isEnd = response.length < take;
    
        if (refresh) {
            set({
                transactions: response,
                paginationTransactions: {
                    skip: response.length,
                    take,
                    isEnd,
                },
            });
        } else {
            const newTransactions = [...transactions, ...response];
            set({
                transactions: newTransactions,
                paginationTransactions: {
                    skip: newTransactions.length,
                    take,
                    isEnd,
                },
            });
        }
    }
    ,

    getPreviewTransactions: async (account_id: string, user_id = '') => {
        const { setLoading, setError, setPreviewTransactions } = get();
        
        const endpoint = `/transactions/history?skip=${0}&take=${10}&account_id=${account_id}&user_id=${user_id}`;
        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}${endpoint}`,
            method: 'GET',
            setLoading: setLoading,
        });
            
        if (error) {
            setError(error);
            return;
        }
            
        setError(null);
        setPreviewTransactions(response);
    },

    logoutWallet: () => {
        set({
            error: null,
            transactions: [],
            previewTransactions: [],
            paginationTransactions: {
                skip: 0,
                take: 10,
                isEnd: false,
            },
        })
    }
}));

