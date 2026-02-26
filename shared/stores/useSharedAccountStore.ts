import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { SharedAccount } from "../entities/SharedAccount";
import { secureFetch } from "../http/secureFetch";

interface SharedAccountStore {
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (err: string | null) => void;

    sharedAccounts: SharedAccount[];
    setSharedAccounts: (accounts: SharedAccount[]) => void;

    pagination: { cursor: string | null; take: number; isEnd: boolean; };

    // Actions
    getSharedAccounts: (account_id?: string, options?: { refresh?: boolean }) => Promise<void>;
    createSharedAccount: (data: { name: string, account_id: string, identification_number: string, phone_associated?: string, email_associated?: string }) => Promise<SharedAccount | null>;
    updateSharedAccount: (id: string, data: Partial<{ name: string, account_id: string, identification_number: string, phone_associated: string, email_associated: string }>) => Promise<SharedAccount | null>;
    deleteSharedAccount: (id: string) => Promise<boolean>;
    restoreSharedAccount: (id: string) => Promise<boolean>;
    hardDeleteSharedAccount: (id: string) => Promise<boolean>;
}

export const useSharedAccountStore = create<SharedAccountStore>((set, get) => ({
    loading: false,
    error: null,
    setLoading: (v: boolean) => set({ loading: v }),
    setError: (err: string | null) => set({ error: err }),

    sharedAccounts: [],
    setSharedAccounts: (accounts: SharedAccount[]) => set({ sharedAccounts: accounts }),

    pagination: { cursor: null, take: 10, isEnd: false },

    getSharedAccounts: async (account_id?: string, options = {}) => {
        const { refresh = false } = options;
        const state = get();

        if (state.loading) return;
        if (state.pagination.isEnd && !refresh) return;

        set({ loading: true, error: null });

        const take = state.pagination.take;
        const cursor = refresh ? null : state.pagination.cursor;

        let url = `${MALET_API_URL}/shared/accounts?take=${take}`;
        if (account_id) url += `&account_id=${account_id}`;
        if (cursor) url += `&cursor=${cursor}`;

        const { error, response } = await secureFetch<{ data: SharedAccount[]; nextCursor: string | null }>({
            url,
            method: 'GET',
            setLoading: get().setLoading,
        });

        if (error || !response) {
            set({ error: error ?? 'Error fetching shared accounts', loading: false });
            return;
        }

        const isEnd = response.nextCursor === null || response.data.length === 0;
        const newAccounts = refresh ? response.data : [...state.sharedAccounts, ...response.data];

        set({
            error: null,
            sharedAccounts: newAccounts,
            pagination: { cursor: response.nextCursor, take, isEnd },
            loading: false
        });
    },

    createSharedAccount: async (data) => {
        const { error, response } = await secureFetch<SharedAccount>({
            url: `${MALET_API_URL}/shared/accounts`,
            method: 'POST',
            body: data,
            setLoading: get().setLoading
        });

        if (error || !response) {
            get().setError(error ?? 'Error creating shared account');
            return null;
        }

        get().setError(null);
        set({ sharedAccounts: [response, ...get().sharedAccounts] });
        return response;
    },

    updateSharedAccount: async (id, data) => {
        set({ loading: true, error: null });

        const { error, response } = await secureFetch<SharedAccount>({
            url: `${MALET_API_URL}/shared/accounts/${id}`,
            method: 'PUT',
            body: data,
            setLoading: get().setLoading
        });

        if (error || !response) {
            set({ error: error ?? 'Error updating shared account', loading: false });
            return null;
        }

        set({
            error: null,
            loading: false,
            sharedAccounts: get().sharedAccounts.map(sa => sa.id === id ? { ...sa, ...response } : sa)
        });

        return response;
    },

    deleteSharedAccount: async (id) => {
        set({ loading: true, error: null });

        const { error } = await secureFetch({
            url: `${MALET_API_URL}/shared/accounts/${id}`,
            method: 'DELETE',
            setLoading: get().setLoading
        });

        if (error) {
            set({ error: error ?? 'Error deleting shared account', loading: false });
            return false;
        }

        set({
            error: null,
            loading: false,
            sharedAccounts: get().sharedAccounts.filter(sa => sa.id !== id)
        });

        return true;
    },

    restoreSharedAccount: async (id) => {
        set({ loading: true, error: null });

        const { error, response } = await secureFetch<SharedAccount>({
            url: `${MALET_API_URL}/shared/accounts/${id}/restore`,
            method: 'PUT',
            setLoading: get().setLoading
        });

        if (error || !response) {
            set({ error: error ?? 'Error restoring shared account', loading: false });
            return false;
        }

        // Normally, the restored account might need to be inserted back if the current list shows active accounts.
        // Assuming we just append it:
        set({
            error: null,
            loading: false,
            sharedAccounts: [...get().sharedAccounts, response]
        });

        return true;
    },

    hardDeleteSharedAccount: async (id) => {
        set({ loading: true, error: null });

        const { error } = await secureFetch({
            url: `${MALET_API_URL}/shared/accounts/${id}/hard`,
            method: 'DELETE',
            setLoading: get().setLoading
        });

        if (error) {
            set({ error: error ?? 'Error hard deleting shared account', loading: false });
            return false;
        }

        set({
            error: null,
            loading: false,
            sharedAccounts: get().sharedAccounts.filter(sa => sa.id !== id)
        });

        return true;
    }
}));
