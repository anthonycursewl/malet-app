import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { Account } from "../entities/Account";
import { secureFetch } from "../http/secureFetch";
import { offlineQueue } from "../offline/offlineQueue";
import { dataCache, CACHE_KEYS } from "../offline/dataCache";
import { isOnline } from "../offline/networkUtils";
import { useSessionStore } from "./useSessionStore";

interface AccountStore {
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (err: string | null) => void;
    accounts: Account[];
    deletedAccounts: Account[];
    selectedAccount: Account | null;
    setSelectedAccount: (account: Account | null) => Promise<void>;
    isBalanceHidden: boolean;
    toggleBalanceHidden: () => Promise<void>;
    loadBalanceHidden: () => Promise<void>;

    createAccount: (account: Omit<Account, 'created_at' | 'updated_at' | 'id'>) => Promise<Account>;
    updateAccount: (
        account_id: string,
        account: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
    ) => Promise<Account>;
    getAllAccountsByUserId: (options?: { refresh?: boolean }) => Promise<void>;
    getDeletedAccounts: (options?: { refresh?: boolean }) => Promise<void>;
    deleteAccount: (account_id: string) => Promise<boolean>;
    restoreAccount: (account_id: string) => Promise<boolean>;
    updateBalanceInMemory: (account_id: string, amount: number, type: 'expense' | 'saving') => Promise<void>;
    paginationDeletedAccounts: {
        cursor: string | null;
        take: number;
        isEnd: boolean;
    };
    setPaginationDeletedAccounts: (pagination: { cursor: string | null; take: number; isEnd: boolean }) => void;
    logoutAccount: () => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    loading: false,
    error: null,
    setLoading: (v: boolean) => set({ loading: v }),
    setError: (err: string | null) => set({ error: err }),
    accounts: [],
    deletedAccounts: [],
    selectedAccount: null,
    isBalanceHidden: true,
    paginationDeletedAccounts: {
        cursor: null,
        take: 10,
        isEnd: false,
    },
    setPaginationDeletedAccounts: (pagination) => set({ paginationDeletedAccounts: pagination }),

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

    createAccount: async (account) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) throw new Error('No active session');

        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<Account>({
                    url: MALET_API_URL + '/accounts/create',
                    method: 'POST',
                    body: account,
                });
                if (error || !response) throw new Error(error ?? 'Error al crear la cuenta');

                const asAccount = { ...response, user_id: userId, created_at: new Date(response.created_at), updated_at: new Date(response.updated_at) };
                set((s) => ({
                    accounts: [asAccount, ...s.accounts.filter((a) => a.id !== asAccount.id)],
                    loading: false,
                    error: null,
                }));
                await dataCache.set(CACHE_KEYS.ACCOUNTS, get().accounts);
                return asAccount;
            } else {
                const offlineId = 'offline_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
                const offlineAccount: Account = {
                    id: offlineId,
                    user_id: userId,
                    name: account.name,
                    balance: account.balance,
                    currency: account.currency,
                    icon: account.icon,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                await offlineQueue.enqueue({
                    entityType: 'accounts',
                    action: 'create',
                    payload: { ...account, user_id: userId },
                });
                set((s) => ({
                    accounts: [offlineAccount, ...s.accounts],
                    loading: false,
                    error: null,
                }));
                return offlineAccount;
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al crear la cuenta', loading: false });
            throw e;
        }
    },

    updateAccount: async (account_id, account) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: MALET_API_URL + `/accounts/${account_id}`,
                    method: 'PUT',
                    body: account,
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'accounts',
                    action: 'update',
                    payload: { id: account_id, ...account },
                });
            }

            const updatedAccounts = get().accounts.map((acc) =>
                acc.id === account_id ? { ...acc, ...account } : acc
            );
            set({ accounts: updatedAccounts, loading: false, error: null });

            if (get().selectedAccount?.id === account_id) {
                set({ selectedAccount: { ...get().selectedAccount!, ...account } });
            }
            await dataCache.set(CACHE_KEYS.ACCOUNTS, get().accounts);
            return get().accounts.find((a) => a.id === account_id)!;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al actualizar la cuenta', loading: false });
            throw e;
        }
    },

    getAllAccountsByUserId: async (options = {}) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) {
            set({ accounts: [], deletedAccounts: [] });
            return;
        }

        const { refresh = false } = options;
        if (get().loading && !refresh) return;

        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<Account[]>({
                    url: MALET_API_URL + '/accounts/get/all',
                    method: 'GET',
                });
                if (error) throw new Error(error);

                const raw = response ?? [];
                const rawArr = Array.isArray(raw) ? raw : (raw as any)?.data ?? (raw as any)?.accounts ?? [];
                const accounts = rawArr.map((a: any) => ({
                    ...a,
                    user_id: userId,
                    created_at: new Date(a.created_at),
                    updated_at: new Date(a.updated_at),
                }));
                set({ accounts, loading: false, error: null });
                await dataCache.set(CACHE_KEYS.ACCOUNTS, accounts);
            } else {
                const cached = await dataCache.get<Account[]>(CACHE_KEYS.ACCOUNTS);
                set({ accounts: cached ?? [], loading: false, error: null });
            }

            await get().loadBalanceHidden();

            const preferredAccountId = await AsyncStorage.getItem('selectedAccountId');
            if (preferredAccountId) {
                const preferred = get().accounts.find((acc) => acc.id === preferredAccountId);
                if (preferred) set({ selectedAccount: preferred });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar las cuentas', loading: false });
        }
    },

    getDeletedAccounts: async (options = {}) => {
        const userId = useSessionStore.getState().currentUserId;
        if (!userId) return;

        const { refresh = false } = options;
        if (get().loading) return;
        if (get().paginationDeletedAccounts.isEnd && !refresh) return;

        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const take = get().paginationDeletedAccounts.take;
                const cursor = refresh ? null : get().paginationDeletedAccounts.cursor;

                let url = `${MALET_API_URL}/accounts/get/deleted?take=${take}&user_id=${userId}`;
                if (cursor) url += `&cursor=${cursor}`;

                const { error, response } = await secureFetch<{ data: Account[]; nextCursor: string | null }>({
                    url,
                    method: 'GET',
                });
                if (error) throw new Error(error);

                const raw = response?.data ?? [];
                const accounts = raw.map((a: any) => ({
                    ...a,
                    user_id: userId,
                    created_at: new Date(a.created_at),
                    updated_at: new Date(a.updated_at),
                }));
                const nextCursor = (response as any)?.nextCursor ?? null;
                const isEnd = nextCursor === null || accounts.length === 0;

                if (refresh) {
                    set({
                        deletedAccounts: accounts,
                        paginationDeletedAccounts: { cursor: nextCursor, take, isEnd },
                        loading: false, error: null,
                    });
                } else {
                    set({
                        deletedAccounts: [...get().deletedAccounts, ...accounts],
                        paginationDeletedAccounts: { cursor: nextCursor, take, isEnd },
                        loading: false, error: null,
                    });
                }
                await dataCache.set(CACHE_KEYS.DELETED_ACCOUNTS, get().deletedAccounts);
            } else {
                const cached = await dataCache.get<Account[]>(CACHE_KEYS.DELETED_ACCOUNTS);
                set({ deletedAccounts: cached ?? [], loading: false, error: null });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar la papelera', loading: false });
        }
    },

    deleteAccount: async (account_id) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: MALET_API_URL + `/accounts/${account_id}`,
                    method: 'DELETE',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'accounts',
                    action: 'delete',
                    payload: { id: account_id },
                });
            }

            const state = get();
            const isSelected = state.selectedAccount?.id === account_id;

            set({
                accounts: state.accounts.filter((acc) => acc.id !== account_id),
                error: null,
                loading: false,
                selectedAccount: isSelected ? null : state.selectedAccount,
            });

            if (isSelected) {
                await AsyncStorage.removeItem('selectedAccountId');
            }
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al eliminar la cuenta', loading: false });
            return false;
        }
    },

    restoreAccount: async (account_id) => {
        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch({
                    url: MALET_API_URL + `/accounts/${account_id}/restore`,
                    method: 'PUT',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'accounts',
                    action: 'update',
                    payload: { id: account_id, restored: true },
                });
            }

            const state = get();
            const restoredAccount = state.deletedAccounts.find((a) => a.id === account_id);

            set({
                deletedAccounts: state.deletedAccounts.filter((acc) => acc.id !== account_id),
                accounts: restoredAccount ? [...state.accounts, restoredAccount] : state.accounts,
                error: null,
                loading: false,
            });
            return true;
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al restaurar la cuenta', loading: false });
            return false;
        }
    },

    updateBalanceInMemory: async (account_id, amount, type) => {
        if (await isOnline()) {
            await secureFetch({
                url: MALET_API_URL + `/accounts/${account_id}/balance`,
                method: 'PATCH',
                body: { amount, type },
            });
        } else {
            await offlineQueue.enqueue({
                entityType: 'accounts',
                action: 'update',
                payload: { id: account_id, balance_delta: amount, type },
            });
        }

        set((s) => ({
            accounts: s.accounts.map((a) =>
                a.id === account_id
                    ? { ...a, balance: type === 'expense' ? a.balance - amount : a.balance + amount }
                    : a
            ),
            selectedAccount:
                s.selectedAccount?.id === account_id
                    ? {
                          ...s.selectedAccount,
                          balance: type === 'expense' ? s.selectedAccount.balance - amount : s.selectedAccount.balance + amount,
                      }
                    : s.selectedAccount,
        }));
    },

    logoutAccount: async () => {
        await AsyncStorage.removeItem('selectedAccountId');
        set({
            error: null,
            accounts: [],
            deletedAccounts: [],
            selectedAccount: null,
            paginationDeletedAccounts: { cursor: null, take: 10, isEnd: false },
        });
    },
}));
