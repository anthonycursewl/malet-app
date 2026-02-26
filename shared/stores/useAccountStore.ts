import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { Account } from "../entities/Account";
import { secureFetch } from "../http/secureFetch";

interface AccountStore {
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (err: string | null) => void;
    accounts: Account[]
    setAccounts: (account: Account) => void;
    deletedAccounts: Account[];
    selectedAccount: Account | null;
    setSelectedAccount: (account: Account | null) => Promise<void>;
    isBalanceHidden: boolean;
    toggleBalanceHidden: () => Promise<void>;
    loadBalanceHidden: () => Promise<void>;
    paginationAccounts: { cursor: string | null; take: number; isEnd: boolean; };
    paginationDeletedAccounts: { cursor: string | null; take: number; isEnd: boolean; };

    // Methods
    createAccount: (account: Omit<Account, 'created_at' | 'updated_at' | 'id'>) => Promise<Account>
    updateAccount: (account_id: string, account: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<Account>
    getAllAccountsByUserId: (options?: { refresh?: boolean }) => Promise<void>
    getDeletedAccounts: (options?: { refresh?: boolean }) => Promise<void>
    deleteAccount: (account_id: string) => Promise<boolean>
    restoreAccount: (account_id: string) => Promise<boolean>
    updateBalanceInMemory: (account_id: string, amount: number, type: 'expense' | 'saving') => void
    logoutAccount: () => Promise<void>
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    loading: false,
    error: null,
    setLoading: (v: boolean) => set({ loading: v }),
    setError: (err: string | null) => set({ error: err }),
    accounts: [],
    deletedAccounts: [],
    paginationAccounts: { cursor: null, take: 15, isEnd: false },
    paginationDeletedAccounts: { cursor: null, take: 15, isEnd: false },
    setAccounts: (account: Account) => set({ accounts: [...get().accounts, account] }),
    selectedAccount: null,
    isBalanceHidden: true,
    toggleBalanceHidden: async () => {
        const newValue = !get().isBalanceHidden;
        set({ isBalanceHidden: newValue });
        await AsyncStorage.setItem('isBalanceHidden', JSON.stringify(newValue));
    },
    loadBalanceHidden: async () => {
        const value = await AsyncStorage.getItem('isBalanceHidden');
        if (value) {
            set({ isBalanceHidden: JSON.parse(value) });
        }
    },
    setSelectedAccount: async (account: Account | null) => {
        set({ selectedAccount: account });
        if (account) {
            await AsyncStorage.setItem('selectedAccountId', account.id);
        } else {
            await AsyncStorage.removeItem('selectedAccountId');
        }
    },


    createAccount: async (account: Omit<Account, 'created_at' | 'updated_at' | 'id'>) => {
        const { error, response } = await secureFetch<Account>({
            url: MALET_API_URL + '/accounts/create',
            method: 'POST',
            body: account,
            setLoading: get().setLoading
        })

        if (error || !response) {
            get().setError(error ?? 'Error al crear la cuenta');
            return null as unknown as Account;
        }

        get().setError(null);
        get().setAccounts(response);
        return response;
    },

    updateAccount: async (account_id: string, account: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => {
        set({
            loading: true,
            error: null
        })

        const { error, response } = await secureFetch<Account>({
            url: `${MALET_API_URL}/accounts/update/${account_id}`,
            method: 'PUT',
            body: account,
            setLoading: get().setLoading
        })

        if (error || !response) {
            set({ error: error ?? 'Error al actualizar la cuenta', loading: false })
            return null as unknown as Account;
        }

        set({ error: null, loading: false })

        const updatedAccounts = get().accounts.map(acc =>
            acc.id === account_id ? { ...acc, ...response } : acc
        );
        set({ accounts: updatedAccounts });

        if (get().selectedAccount?.id === account_id) {
            set({ selectedAccount: { ...get().selectedAccount!, ...response } });
        }

        return response;
    },

    getAllAccountsByUserId: async (options = {}) => {
        const { refresh = false } = options;
        const state = get();
        if (state.loading) return;
        if (state.paginationAccounts.isEnd && !refresh) return;

        set({ loading: true, error: null });

        const take = state.paginationAccounts.take;
        const cursor = refresh ? null : state.paginationAccounts.cursor;

        let url = `${MALET_API_URL}/accounts/get/all?take=${take}`;
        if (cursor) url += `&cursor=${cursor}`;

        const { error, response } = await secureFetch<{ data: Account[]; nextCursor: string | null }>({
            url,
            method: 'GET',
            setLoading: get().setLoading,
        })

        if (error || !response) {
            set({ error: error ?? 'Error al cargar las cuentas', loading: false });
            return;
        }

        const isEnd = response.nextCursor === null || response.data.length === 0;
        const newAccounts = refresh ? response.data : [...state.accounts, ...response.data];

        set({
            error: null,
            accounts: newAccounts,
            paginationAccounts: { cursor: response.nextCursor, take, isEnd },
            loading: false
        });

        if (refresh) {
            await get().loadBalanceHidden();

            const preferredAccountId = await AsyncStorage.getItem('selectedAccountId');
            if (preferredAccountId) {
                const preferred = response.data.find(acc => acc.id === preferredAccountId);
                if (preferred) {
                    set({ selectedAccount: preferred });
                }
            }
        }
    },

    getDeletedAccounts: async (options = {}) => {
        const { refresh = false } = options;
        const state = get();
        if (state.loading) return;
        if (state.paginationDeletedAccounts.isEnd && !refresh) return;

        set({ loading: true, error: null });

        const take = state.paginationDeletedAccounts.take;
        const cursor = refresh ? null : state.paginationDeletedAccounts.cursor;

        let url = `${MALET_API_URL}/accounts/get/deleted?take=${take}`;
        if (cursor) url += `&cursor=${cursor}`;

        const { error, response } = await secureFetch<{ data: Account[]; nextCursor: string | null }>({
            url,
            method: 'GET',
            setLoading: get().setLoading,
        });

        if (error || !response) {
            set({ error: error ?? 'Error al cargar la papelera', loading: false });
            return;
        }

        const isEnd = response.nextCursor === null || response.data.length === 0;
        const newDeleted = refresh ? response.data : [...state.deletedAccounts, ...response.data];

        set({
            error: null,
            deletedAccounts: newDeleted,
            paginationDeletedAccounts: { cursor: response.nextCursor, take, isEnd },
            loading: false
        });
    },

    deleteAccount: async (account_id: string) => {
        set({ loading: true, error: null });
        const { error } = await secureFetch({
            url: `${MALET_API_URL}/accounts/delete/${account_id}`,
            method: 'DELETE',
            setLoading: get().setLoading,
        });

        if (error) {
            set({ error: error ?? 'Error al mover la cuenta a la papelera', loading: false });
            return false;
        }

        const state = get();
        const isSelected = state.selectedAccount?.id === account_id;

        set({
            accounts: state.accounts.filter(acc => acc.id !== account_id),
            error: null,
            loading: false,
            selectedAccount: isSelected ? null : state.selectedAccount
        });

        if (isSelected) {
            await AsyncStorage.removeItem('selectedAccountId');
        }

        return true;
    },

    restoreAccount: async (account_id: string) => {
        set({ loading: true, error: null });
        const { error } = await secureFetch({
            url: `${MALET_API_URL}/accounts/restore/${account_id}`,
            method: 'POST',
            setLoading: get().setLoading,
        });

        if (error) {
            set({ error: error ?? 'Error al restaurar la cuenta', loading: false });
            return false;
        }

        const state = get();
        const restoredAccount = state.deletedAccounts.find(a => a.id === account_id);

        set({
            deletedAccounts: state.deletedAccounts.filter(acc => acc.id !== account_id),
            accounts: restoredAccount ? [...state.accounts, restoredAccount] : state.accounts,
            error: null,
            loading: false
        });

        return true;
    },

    updateBalanceInMemory: (account_id: string, amount: number, type: 'expense' | 'saving') => {
        const { accounts } = get()
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === account_id) {

                set({
                    selectedAccount: {
                        ...acc,
                        balance: type === 'expense' ? acc.balance - amount : acc.balance + amount
                    }
                })
                return {
                    ...acc,
                    balance: type === 'expense' ? acc.balance - amount : acc.balance + amount
                }
            }
            return acc;
        })
        set({ accounts: updatedAccounts })
    },

    logoutAccount: async () => {
        await AsyncStorage.removeItem('selectedAccountId');
        set({
            error: null,
            accounts: [],
            deletedAccounts: [],
            paginationAccounts: { cursor: null, take: 15, isEnd: false },
            paginationDeletedAccounts: { cursor: null, take: 15, isEnd: false },
            selectedAccount: null,
        })
    }

}))