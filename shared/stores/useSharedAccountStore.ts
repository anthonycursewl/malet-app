import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { SharedAccount } from "../entities/SharedAccount";
import { secureFetch } from "../http/secureFetch";
import { offlineQueue } from "../offline/offlineQueue";
import { dataCache, CACHE_KEYS } from "../offline/dataCache";
import { isOnline } from "../offline/networkUtils";
import { useSessionStore } from "./useSessionStore";

interface SharedAccountStore {
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (err: string | null) => void;

    sharedAccounts: SharedAccount[];
    setSharedAccounts: (accounts: SharedAccount[]) => void;

    pagination: { cursor: string | null; take: number; isEnd: boolean };

    // Actions
    getSharedAccounts: (account_id?: string, options?: { refresh?: boolean }) => Promise<void>;
    createSharedAccount: (data: {
        name: string;
        account_id: string;
        identification_number: string;
        phone_associated?: string;
        email_associated?: string;
    }) => Promise<SharedAccount | null>;
    updateSharedAccount: (
        id: string,
        data: Partial<{
            name: string;
            account_id: string;
            identification_number: string;
            phone_associated: string;
            email_associated: string;
        }>
    ) => Promise<SharedAccount | null>;
    deleteSharedAccount: (id: string) => Promise<boolean>;
    restoreSharedAccount: (id: string) => Promise<boolean>;
    hardDeleteSharedAccount: (id: string) => Promise<boolean>;
    logoutSharedAccount: () => void;
}

export const useSharedAccountStore = create<SharedAccountStore>((set, get) => ({
    loading: false,
    error: null,
    setLoading: (v: boolean) => set({ loading: v }),
    setError: (err: string | null) => set({ error: err }),

    sharedAccounts: [],
    setSharedAccounts: (accounts: SharedAccount[]) => set({ sharedAccounts: accounts }),

    pagination: { cursor: null, take: 10, isEnd: false },

    getSharedAccounts: async (account_id, options = {}) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) return;

        const { refresh = false } = options;
        const state = get();

        if (state.loading) return;
        if (state.pagination.isEnd && !refresh) return;

        set({ loading: true, error: null });

        try {
            if (await isOnline()) {
                const take = state.pagination.take;
                const cursor = refresh ? null : state.pagination.cursor;

                let url = `${MALET_API_URL}/shared/accounts?take=${take}`;
                if (account_id) url += `&account_id=${account_id}`;
                if (cursor) url += `&cursor=${cursor}`;

                const { error, response } = await secureFetch<{ data: SharedAccount[]; nextCursor: string | null }>({
                    url,
                    method: 'GET',
                });

                if (error || !response) throw new Error(error ?? 'Error fetching shared accounts');

                const isEnd = response.nextCursor === null || response.data.length === 0;
                const newAccounts = refresh ? response.data : [...state.sharedAccounts, ...response.data];

                set({
                    sharedAccounts: newAccounts,
                    pagination: { cursor: response.nextCursor, take, isEnd },
                    loading: false, error: null,
                });
                await dataCache.set(CACHE_KEYS.SHARED_ACCOUNTS, newAccounts);
            } else {
                const cached = await dataCache.get<SharedAccount[]>(CACHE_KEYS.SHARED_ACCOUNTS);
                set({ sharedAccounts: cached ?? [], loading: false, error: null });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error fetching shared accounts', loading: false });
        }
    },

    createSharedAccount: async (data) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<SharedAccount>({
                    url: `${MALET_API_URL}/shared/accounts`,
                    method: 'POST',
                    body: data,
                });
                if (error || !response) throw new Error(error ?? 'Error creating shared account');

                set({
                    sharedAccounts: [response, ...get().sharedAccounts],
                    error: null,
                    loading: false,
                });
                await dataCache.set(CACHE_KEYS.SHARED_ACCOUNTS, get().sharedAccounts);
                return response;
            } else {
                const offlineId = 'offline_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
                const offlineSa: SharedAccount = {
                    id: offlineId,
                    name: data.name,
                    account_id: data.account_id,
                    identification_number: data.identification_number,
                    phone_associated: data.phone_associated,
                    email_associated: data.email_associated,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await offlineQueue.enqueue({
                    entityType: 'shared_accounts',
                    action: 'create',
                    payload: data,
                });
                set({
                    sharedAccounts: [offlineSa, ...get().sharedAccounts],
                    error: null,
                    loading: false,
                });
                return offlineSa;
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error creating shared account', loading: false });
            return null;
        }
    },

    updateSharedAccount: async (id, data) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<SharedAccount>({
                    url: `${MALET_API_URL}/shared/accounts/${id}`,
                    method: 'PUT',
                    body: data,
                });
                if (error || !response) throw new Error(error ?? 'Error updating shared account');
            } else {
                await offlineQueue.enqueue({
                    entityType: 'shared_accounts',
                    action: 'update',
                    payload: { id, ...data },
                });
            }

            set({
                loading: false,
                error: null,
                sharedAccounts: get().sharedAccounts.map((sa) =>
                    sa.id === id ? { ...sa, ...data } : sa
                ),
            });
            await dataCache.set(CACHE_KEYS.SHARED_ACCOUNTS, get().sharedAccounts);
            return get().sharedAccounts.find((sa) => sa.id === id) ?? null;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error updating shared account', loading: false });
            return null;
        }
    },

    deleteSharedAccount: async (id) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: `${MALET_API_URL}/shared/accounts/${id}`,
                    method: 'DELETE',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'shared_accounts',
                    action: 'delete',
                    payload: { id },
                });
            }

            set({
                sharedAccounts: get().sharedAccounts.filter((sa) => sa.id !== id),
                error: null,
                loading: false,
            });
            await dataCache.set(CACHE_KEYS.SHARED_ACCOUNTS, get().sharedAccounts);
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error deleting shared account', loading: false });
            return false;
        }
    },

    restoreSharedAccount: async (id) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: `${MALET_API_URL}/shared/accounts/${id}/restore`,
                    method: 'PUT',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'shared_accounts',
                    action: 'update',
                    payload: { id, restored: true },
                });
            }

            set({ loading: false, error: null });
            await dataCache.set(CACHE_KEYS.SHARED_ACCOUNTS, get().sharedAccounts);
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error restoring shared account', loading: false });
            return false;
        }
    },

    hardDeleteSharedAccount: async (id) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: `${MALET_API_URL}/shared/accounts/${id}/hard`,
                    method: 'DELETE',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'shared_accounts',
                    action: 'delete',
                    payload: { id, hard: true },
                });
            }

            set({
                sharedAccounts: get().sharedAccounts.filter((sa) => sa.id !== id),
                error: null,
                loading: false,
            });
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error hard deleting shared account', loading: false });
            return false;
        }
    },

    logoutSharedAccount: () => {
        set({
            error: null,
            sharedAccounts: [],
            pagination: { cursor: null, take: 10, isEnd: false },
        });
    },
}));
