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
    selectedAccount: Account | null;
    setSelectedAccount: (account: Account | null) => void;

    // Methods
    createAccount: (account: Omit<Account, 'created_at' | 'updated_at' | 'id'>) => Promise<Account>
    updateAccount: (account_id: string, account: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<Account>
    getAllAccountsByUserId: () => Promise<void>
    updateBalanceInMemory: (account_id: string, amount: number, type: 'expense' | 'saving') => void
    logoutAccount: () => void
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    loading: false,
    error: null,
    setLoading: (v: boolean) => set({ loading: v }),
    setError: (err: string | null) => set({ error: err }),
    accounts: [],
    setAccounts: (account: Account) => set({ accounts: [...get().accounts, account] }),
    selectedAccount: null,
    setSelectedAccount: (account: Account | null) => set({ selectedAccount: account }),


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

    getAllAccountsByUserId: async () => {
        set({
            loading: true,
            error: null
        })
        const { error, response } = await secureFetch<Account[]>({
            url: `${MALET_API_URL}/accounts/get/all`,
            method: 'GET',
            setLoading: get().setLoading,
            expectArray: true
        })

        if (error || !response) {
            set({ error: error ?? 'Error al cargar las cuentas', loading: false })
            return;
        }

        set({ error: null, accounts: response, loading: false });
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

    logoutAccount: () => {
        set({
            error: null,
            accounts: [],
            selectedAccount: null,
        })
    }

}))