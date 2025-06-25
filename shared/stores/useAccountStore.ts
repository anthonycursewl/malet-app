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
    getAllAccountsByUserId: () => Promise<void>
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
        const { error, response } = await secureFetch({
            url: MALET_API_URL + '/accounts/create',
            method: 'POST',
            body: JSON.stringify(account),
            setLoading: get().setLoading
        })

        if (error) {
            get().setError(error);
            return
        }

        get().setError(null);
        get().setAccounts(response);
        return response;
    },

    getAllAccountsByUserId: async () => {
        get().setError(null)
        const { error, response } = await secureFetch({
            url: MALET_API_URL + '/accounts/get/all',
            method: 'GET',
            setLoading: get().setLoading
        }) 

        if (error) {
            get().setError(error)
        }

        get().setError(null);
        set({
            accounts: response
        });
    }

}))