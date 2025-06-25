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
    setTransactions: (transactions: TransactionItem[]) => void;
    paginationTransactions: {
        skip: number;
        take: number;
        isEnd: boolean;
    }

    // methods
    addTrasanction: (transaction: Omit<TransactionItem, 'id' | 'issued_at'>) => Promise<void>;
    getHistoryTransactions: (account_id: string, isPreview?: boolean) => Promise<void>;
    setPaginationTransactions: (pagination: { skip: number; take: number; isEnd: boolean }) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
        loading: false,
        setLoading: (loading: boolean) => set({ loading }),
        error: null,
        setError: (error: string | null) => set({ error }),
        transactions: [],
        setTransactions: (transactions: TransactionItem[]) => set({ transactions }),
        paginationTransactions: {
            skip: 0,
            take: 10,
            isEnd: false,
        },

        setPaginationTransactions: (pagination: { skip: number; take: number; isEnd: boolean }) => 
        set({ paginationTransactions: pagination }),
        
        // Methods
        addTrasanction: async (transaction: Omit<TransactionItem, 'id' | 'issued_at'>) => {
            const { error, response } = await secureFetch({
                url: MALET_API_URL + '/transactions/save',
                method: 'POST',
                body: JSON.stringify(transaction),
                setLoading: get().setLoading,
            })
            
            if (error) {
                get().setError(error);
                return
            }
            
            get().setError(null);
            get().setTransactions([response, ...get().transactions]);
        },

        getHistoryTransactions: async (account_id: string, isPreview: boolean = false) => {
            const { transactions, loading, paginationTransactions, setError, setLoading } = get()
            setError(null);

            if (isPreview) {
                set({
                    paginationTransactions: {
                        skip: 0,
                        take: 10,
                        isEnd: false,
                    }
                })
            }
            

            if (loading || paginationTransactions.isEnd) {
                return;
            }
            
            const skip = isPreview ? 0 : paginationTransactions.skip + transactions.length;
            
            const { error, response } = await secureFetch({
                url: MALET_API_URL + 
                `/transactions/history?skip=${skip}&take=${paginationTransactions.take}&account_id=${account_id}`,
                method: 'GET',
                setLoading: setLoading,
            })
            
            if (error) {
                setError(error);
                return
            }

            if (response.length < paginationTransactions.take && isPreview === false) {
                set({
                    paginationTransactions: {
                        ...paginationTransactions,
                        isEnd: true,
                    }
                })
            }
            
            setError(null);   
            set({
                transactions: isPreview ? response : [...transactions, ...response]
            });
        }
    }))

