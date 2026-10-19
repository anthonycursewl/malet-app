import { create } from 'zustand';
import {
    Customer,
    CustomerInput,
    CustomerStats,
    PaymentMethod,
    Receipt,
    Sale,
    SaleInput,
    SalesFilters,
    SalesSeries,
    SalesStore,
    SalesSummary,
    SeriesPeriod,
    StoreCurrency,
    StoreInvite,
    StoreInviteInfo,
    StoreMember,
    StoreNotificationGroup,
    StoreNotificationsConfig,
    StorePhotoKind,
    StoreProduct,
    StoreReceiptMode,
} from '../entities/SalesModule';
import { inviteErrorForStatus, salesModuleService } from '../services/sales/salesModule.service';
import { useAuthStore } from './useAuthStore';
import { useSalesPreferencesStore } from './useSalesPreferencesStore';

interface Pagination {
    cursor: string | null;
    take: number;
    isEnd: boolean;
}

const freshPagination = (take: number): Pagination => ({ cursor: null, take, isEnd: false });

/**
 * Filtro por defecto del panel de la tienda: siempre **Hoy**, así el resumen,
 * la gráfica y el listado abren en el día actual.
 */
const DEFAULT_SALES_FILTERS: SalesFilters = { preset: 'today' };

interface SalesModuleStore {
    /** Mutaciones y apertura de tienda. */
    loading: boolean;
    /** Errores de carga → Alert en pantalla (patrón de la casa). */
    error: string | null;

    // Tiendas
    stores: SalesStore[];
    storesLoading: boolean;
    storesPagination: Pagination;
    currentStore: SalesStore | null;

    // Miembros
    members: StoreMember[];
    membersLoading: boolean;
    membersPagination: Pagination;

    // Productos
    products: StoreProduct[];
    productsLoading: boolean;
    productsPagination: Pagination;

    // Métodos de pago
    paymentMethods: PaymentMethod[];
    paymentMethodsLoading: boolean;

    // Ventas + reportes
    sales: Sale[];
    salesLoading: boolean;
    salesPagination: Pagination;
    salesFilters: SalesFilters;
    summary: SalesSummary | null;
    series: SalesSeries | null;
    seriesPeriod: SeriesPeriod;

    // Recibos
    receipts: Receipt[];
    receiptsLoading: boolean;
    receiptsPagination: Pagination;

    // Clientes
    customers: Customer[];
    customersLoading: boolean;
    customersPagination: Pagination;
    customersSearch: string;

    /** Configuración de avisos por email: **solo el dueño** (el resto recibe 403). */
    loadStoreNotifications: () => Promise<void>;
    saveStoreNotifications: (body: {
        events?: Partial<Record<StoreNotificationGroup, boolean>>;
        digest?: boolean;
        member_ids?: string[];
    }) => Promise<string | null>;
    // Avisos por email (solo el dueño los ve y los cambia)
    notifications: StoreNotificationsConfig | null;
    notificationsLoading: boolean;
    notificationsSaving: boolean;

    // Tiendas
    loadStores: (opts?: { refresh?: boolean }) => Promise<void>;
    createStore: (name: string, currency: StoreCurrency) => Promise<string | null>;
    updateStore: (
        storeId: string,
        body: {
            name?: string;
            currency?: StoreCurrency;
            phone?: string | null;
            email?: string | null;
            address?: string | null;
            receipt_mode?: StoreReceiptMode;
        }
    ) => Promise<string | null>;
    /**
     * Sube la foto (avatar o banner) de la tienda actual: el cliente acota la
     * imagen y el servidor genera las 3 resoluciones.
     */
    uploadStorePhoto: (
        kind: StorePhotoKind,
        file: { uri: string; name: string; type: string },
        onProgress?: (ratio: number) => void
    ) => Promise<string | null>;
    deleteStore: (storeId: string) => Promise<string | null>;
    restoreStore: (storeId: string) => Promise<string | null>;
    hardDeleteStore: (storeId: string) => Promise<string | null>;

    /** Abre una tienda: resetea el contexto y carga todo en paralelo. */
    enterStore: (storeId: string) => Promise<boolean>;

    // Miembros
    loadMembers: (opts?: { refresh?: boolean }) => Promise<void>;
    addMember: (userId: string) => Promise<string | null>;
    removeMember: (memberId: string) => Promise<string | null>;
    restoreMember: (memberId: string) => Promise<string | null>;
    hardDeleteMember: (memberId: string) => Promise<string | null>;

    // Productos
    loadProducts: (opts?: { refresh?: boolean }) => Promise<void>;
    createProduct: (body: { name: string; cost: number; pvp: number }) => Promise<string | null>;
    updateProduct: (
        productId: string,
        body: Partial<{ name: string; cost: number; pvp: number }>
    ) => Promise<string | null>;
    deleteProduct: (productId: string) => Promise<string | null>;
    restoreProduct: (productId: string) => Promise<string | null>;
    hardDeleteProduct: (productId: string) => Promise<string | null>;

    // Métodos de pago
    loadPaymentMethods: () => Promise<void>;
    createPaymentMethod: (name: string) => Promise<string | null>;
    updatePaymentMethod: (
        methodId: string,
        body: { name?: string; active?: boolean }
    ) => Promise<string | null>;
    deletePaymentMethod: (methodId: string) => Promise<string | null>;
    restorePaymentMethod: (methodId: string) => Promise<string | null>;
    hardDeletePaymentMethod: (methodId: string) => Promise<string | null>;

    // Ventas
    loadSales: (opts?: { refresh?: boolean }) => Promise<void>;
    fetchSale: (saleId: string) => Promise<{ sale: Sale | null; error: string | null }>;
    createSale: (body: SaleInput) => Promise<string | null>;
    updateSale: (saleId: string, body: Partial<SaleInput>) => Promise<string | null>;
    deleteSale: (saleId: string) => Promise<string | null>;
    restoreSale: (saleId: string) => Promise<string | null>;
    hardDeleteSale: (saleId: string) => Promise<string | null>;
    setSalesFilters: (patch: Partial<SalesFilters>) => Promise<void>;
    setSeriesPeriod: (period: SeriesPeriod) => Promise<void>;
    refreshSalesAll: () => Promise<void>;
    loadSummary: () => Promise<void>;
    loadSeries: () => Promise<void>;

    // Recibos
    loadReceipts: (opts?: { refresh?: boolean }) => Promise<void>;
    fetchReceipt: (receiptId: string) => Promise<{ receipt: Receipt | null; error: string | null }>;
    fetchSaleReceipt: (
        saleId: string
    ) => Promise<{ receipt: Receipt | null; error: string | null }>;
    issueReceipt: (
        saleId: string,
        body?: { customer_name?: string }
    ) => Promise<{ receipt: Receipt | null; error: string | null }>;
    deleteReceipt: (receiptId: string) => Promise<string | null>;
    restoreReceipt: (receiptId: string) => Promise<string | null>;
    hardDeleteReceipt: (receiptId: string) => Promise<string | null>;
    /** Corrección auditada del "Facturar a" de un recibo emitido. */
    updateReceipt: (receiptId: string, customerName: string | null) => Promise<string | null>;

    // Clientes
    loadCustomers: (opts?: { refresh?: boolean }) => Promise<void>;
    setCustomersSearch: (search: string) => Promise<void>;
    createCustomer: (
        body: CustomerInput
    ) => Promise<{ customer: Customer | null; linkedExisting: boolean; error: string | null }>;
    linkCustomer: (customerId: string) => Promise<string | null>;
    updateCustomer: (customerId: string, body: Partial<CustomerInput>) => Promise<string | null>;
    unlinkCustomer: (customerId: string) => Promise<string | null>;
    hardDeleteCustomer: (customerId: string) => Promise<string | null>;
    fetchCustomerStats: (
        customerId: string
    ) => Promise<{ stats: CustomerStats | null; error: string | null }>;

    // Invitaciones por QR
    generateInvite: (storeId: string) => Promise<{ invite: StoreInvite | null; error: string | null }>;
    revokeInvite: (storeId: string) => Promise<string | null>;
    fetchInviteInfo: (
        token: string
    ) => Promise<{ info: StoreInviteInfo | null; error: string | null }>;
    acceptInvite: (
        token: string
    ) => Promise<{ ok: boolean; storeId: string | null; error: string | null }>;
}

export const useSalesModuleStore = create<SalesModuleStore>((set, get) => ({
    loading: false,
    error: null,

    stores: [],
    storesLoading: false,
    storesPagination: freshPagination(10),
    currentStore: null,

    members: [],
    membersLoading: false,
    membersPagination: freshPagination(20),

    products: [],
    productsLoading: false,
    productsPagination: freshPagination(50),

    paymentMethods: [],
    paymentMethodsLoading: false,

    sales: [],
    salesLoading: false,
    salesPagination: freshPagination(10),
    salesFilters: { ...DEFAULT_SALES_FILTERS },
    summary: null,
    series: null,
    seriesPeriod: 'day',

    receipts: [],
    receiptsLoading: false,
    receiptsPagination: freshPagination(20),

    customers: [],
    customersLoading: false,
    customersPagination: freshPagination(20),
    customersSearch: '',

    // ---------------- Avisos por email ----------------
    notifications: null,
    notificationsLoading: false,
    notificationsSaving: false,

    loadStoreNotifications: async () => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;

        set({ notificationsLoading: true });
        try {
            const { error, response } = await salesModuleService.getStoreNotifications(storeId);
            set({
                notifications: error ? null : response,
                notificationsLoading: false,
            });
        } catch {
            set({ notifications: null, notificationsLoading: false });
        }
    },

    saveStoreNotifications: async (body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';

        set({ notificationsSaving: true });
        try {
            const { error, response } = await salesModuleService.updateStoreNotifications(
                storeId,
                body
            );
            set({
                notificationsSaving: false,
                notifications: response ?? get().notifications,
            });
            return error;
        } catch (e: any) {
            set({ notificationsSaving: false });
            return e?.message ?? 'Error al guardar los avisos por email';
        }
    },
    loadStores: async (opts) => {
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.storesLoading && !refresh) return;
        if (!refresh && state.storesPagination.isEnd) return;

        set({ storesLoading: true, error: null });
        try {
            const cursor = refresh ? null : state.storesPagination.cursor;
            const { error, response } = await salesModuleService.getStores({
                take: state.storesPagination.take,
                cursor,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                stores: refresh
                    ? data
                    : [...s.stores, ...data.filter((d) => !s.stores.some((x) => x.id === d.id))],
                storesPagination: {
                    ...s.storesPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                storesLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                storesLoading: false,
                error: e?.message ?? 'Error al cargar las tiendas',
                // Un error corta la paginación para que onEndReached no re-dispare en bucle.
                // Un pull-to-refresh la reactiva porque ignora isEnd.
                storesPagination: { ...s.storesPagination, isEnd: true },
            }));
        }
    },

    createStore: async (name, currency) => {
        try {
            const { error, response } = await salesModuleService.createStore({ name, currency });
            if (error) return error;
            if (response) {
                set((s) => ({ stores: [response, ...s.stores.filter((x) => x.id !== response.id)] }));
            } else {
                await get().loadStores({ refresh: true });
            }
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al crear la tienda';
        }
    },

    updateStore: async (storeId, body) => {
        try {
            const { error } = await salesModuleService.updateStore(storeId, body);
            if (error) return error;
            set((s) => ({
                stores: s.stores.map((x) => (x.id === storeId ? { ...x, ...body } : x)),
                currentStore:
                    s.currentStore?.id === storeId ? { ...s.currentStore, ...body } : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar la tienda';
        }
    },

    uploadStorePhoto: async (kind, file, onProgress) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda abierta';

        try {
            const { error, response } = await salesModuleService.uploadStorePhoto(
                storeId,
                kind,
                file,
                onProgress
            );
            if (error) return error;
            if (!response) return 'El servidor no devolvió la tienda actualizada';

            // El backend devuelve la tienda con las URLs nuevas.
            set((s) => ({
                stores: s.stores.map((x) => (x.id === storeId ? { ...x, ...response } : x)),
                currentStore:
                    s.currentStore?.id === storeId
                        ? { ...s.currentStore, ...response }
                        : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al subir la foto de la tienda';
        }
    },

    deleteStore: async (storeId) => {
        try {
            const { error } = await salesModuleService.deleteStore(storeId);
            if (error) return error;
            set((s) => ({
                stores: s.stores.filter((x) => x.id !== storeId),
                currentStore: s.currentStore?.id === storeId ? null : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la tienda';
        }
    },

    restoreStore: async (storeId) => {
        try {
            const { error } = await salesModuleService.restoreStore(storeId);
            if (error) return error;
            await get().loadStores({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar la tienda';
        }
    },

    hardDeleteStore: async (storeId) => {
        try {
            const { error } = await salesModuleService.hardDeleteStore(storeId);
            if (error) return error;
            set((s) => ({
                stores: s.stores.filter((x) => x.id !== storeId),
                currentStore: s.currentStore?.id === storeId ? null : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la tienda';
        }
    },

    enterStore: async (storeId) => {
        // El rango con el que se abre Ventas es una preferencia local del usuario.
        const defaultPreset = await useSalesPreferencesStore
            .getState()
            .load(useAuthStore.getState().user?.id);

        set({
            loading: true,
            error: null,
            currentStore: null,
            members: [],
            membersLoading: false,
            membersPagination: freshPagination(20),
            products: [],
            productsLoading: false,
            productsPagination: freshPagination(50),
            paymentMethods: [],
            paymentMethodsLoading: false,
            sales: [],
            salesLoading: false,
            salesPagination: freshPagination(10),
            salesFilters: { preset: defaultPreset },
            summary: null,
            series: null,
            seriesPeriod: 'day',
            receipts: [],
            receiptsLoading: false,
            receiptsPagination: freshPagination(20),
            customers: [],
            customersLoading: false,
            customersPagination: freshPagination(20),
            customersSearch: '',
            notifications: null,
            notificationsLoading: false,
            notificationsSaving: false,
        });
        try {
            const { error, response } = await salesModuleService.getStore(storeId);
            if (error || !response) {
                set({ loading: false, error: error ?? 'No se pudo abrir la tienda' });
                return false;
            }
            set({ currentStore: response });
            await Promise.all([
                get().loadMembers(),
                get().loadProducts({ refresh: true }),
                get().loadPaymentMethods(),
                get().loadSales({ refresh: true }),
                get().loadSummary(),
                get().loadSeries(),
                get().loadReceipts({ refresh: true }),
                get().loadCustomers({ refresh: true }),
            ]);
            set({ loading: false });
            return true;
        } catch (e: any) {
            set({ loading: false, error: e?.message ?? 'No se pudo abrir la tienda' });
            return false;
        }
    },

    // ---------------- Miembros ----------------
    loadMembers: async (opts) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.membersLoading && !refresh) return;
        if (!refresh && state.membersPagination.isEnd) return;

        set({ membersLoading: true });
        try {
            const cursor = refresh ? null : state.membersPagination.cursor;
            const { error, response } = await salesModuleService.getMembers(storeId, {
                take: state.membersPagination.take,
                cursor,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                members: refresh
                    ? data
                    : [...s.members, ...data.filter((d) => !s.members.some((x) => x.id === d.id))],
                membersPagination: {
                    ...s.membersPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                membersLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                membersLoading: false,
                error: e?.message ?? 'Error al cargar los miembros',
                membersPagination: { ...s.membersPagination, isEnd: true },
            }));
        }
    },

    addMember: async (userId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.addMember(storeId, userId);
            if (error) return error;
            await get().loadMembers({ refresh: true });
            set((s) => ({
                currentStore: s.currentStore
                    ? {
                          ...s.currentStore,
                          member_count: (s.currentStore.member_count ?? s.members.length) + 1,
                      }
                    : null,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al agregar el miembro';
        }
    },

    removeMember: async (memberId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.removeMember(storeId, memberId);
            if (error) return error;
            set((s) => ({
                members: s.members.filter((m) => m.id !== memberId),
                currentStore:
                    s.currentStore?.member_count != null
                        ? {
                              ...s.currentStore,
                              member_count: Math.max(0, s.currentStore.member_count - 1),
                          }
                        : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al quitar el miembro';
        }
    },

    restoreMember: async (memberId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.restoreMember(storeId, memberId);
            if (error) return error;
            await get().loadMembers({ refresh: true });
            set((s) => ({
                currentStore: s.currentStore
                    ? {
                          ...s.currentStore,
                          member_count: (s.currentStore.member_count ?? s.members.length) + 1,
                      }
                    : null,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el miembro';
        }
    },

    hardDeleteMember: async (memberId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeleteMember(storeId, memberId);
            if (error) return error;
            set((s) => ({
                members: s.members.filter((m) => m.id !== memberId),
                currentStore:
                    s.currentStore?.member_count != null
                        ? {
                              ...s.currentStore,
                              member_count: Math.max(0, s.currentStore.member_count - 1),
                          }
                        : s.currentStore,
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el miembro';
        }
    },

    // ---------------- Productos ----------------
    loadProducts: async (opts) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.productsLoading && !refresh) return;
        if (!refresh && state.productsPagination.isEnd) return;

        set({ productsLoading: true });
        try {
            const cursor = refresh ? null : state.productsPagination.cursor;
            const { error, response } = await salesModuleService.getProducts(storeId, {
                take: state.productsPagination.take,
                cursor,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                products: refresh
                    ? data
                    : [...s.products, ...data.filter((d) => !s.products.some((x) => x.id === d.id))],
                productsPagination: {
                    ...s.productsPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                productsLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                productsLoading: false,
                error: e?.message ?? 'Error al cargar los productos',
                productsPagination: { ...s.productsPagination, isEnd: true },
            }));
        }
    },

    createProduct: async (body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error, response } = await salesModuleService.createProduct(storeId, body);
            if (error) return error;
            if (response) {
                set((s) => ({
                    products: [response, ...s.products.filter((x) => x.id !== response.id)],
                }));
            } else {
                await get().loadProducts({ refresh: true });
            }
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al crear el producto';
        }
    },

    updateProduct: async (productId, body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.updateProduct(storeId, productId, body);
            if (error) return error;
            set((s) => ({
                products: s.products.map((p) => (p.id === productId ? { ...p, ...body } : p)),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar el producto';
        }
    },

    deleteProduct: async (productId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.deleteProduct(storeId, productId);
            if (error) return error;
            set((s) => ({ products: s.products.filter((p) => p.id !== productId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el producto';
        }
    },

    restoreProduct: async (productId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.restoreProduct(storeId, productId);
            if (error) return error;
            await get().loadProducts({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el producto';
        }
    },

    hardDeleteProduct: async (productId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeleteProduct(storeId, productId);
            if (error) return error;
            set((s) => ({ products: s.products.filter((p) => p.id !== productId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el producto';
        }
    },

    // ---------------- Métodos de pago ----------------
    loadPaymentMethods: async () => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        set({ paymentMethodsLoading: true });
        try {
            const { error, response } = await salesModuleService.getPaymentMethods(storeId);
            if (error) throw new Error(error);
            set({ paymentMethods: response?.data ?? [], paymentMethodsLoading: false });
        } catch (e: any) {
            set({
                paymentMethodsLoading: false,
                error: e?.message ?? 'Error al cargar los métodos de pago',
            });
        }
    },

    createPaymentMethod: async (name) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error, response } = await salesModuleService.createPaymentMethod(storeId, name);
            if (error) return error;
            if (response) {
                set((s) => ({
                    paymentMethods: [
                        response,
                        ...s.paymentMethods.filter((x) => x.id !== response.id),
                    ],
                }));
            } else {
                await get().loadPaymentMethods();
            }
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al crear el método de pago';
        }
    },

    updatePaymentMethod: async (methodId, body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.updatePaymentMethod(storeId, methodId, body);
            if (error) return error;
            set((s) => ({
                paymentMethods: s.paymentMethods.map((m) =>
                    m.id === methodId ? { ...m, ...body } : m
                ),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar el método de pago';
        }
    },

    deletePaymentMethod: async (methodId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.deletePaymentMethod(storeId, methodId);
            if (error) return error;
            set((s) => ({ paymentMethods: s.paymentMethods.filter((m) => m.id !== methodId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el método de pago';
        }
    },

    restorePaymentMethod: async (methodId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.restorePaymentMethod(storeId, methodId);
            if (error) return error;
            await get().loadPaymentMethods();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el método de pago';
        }
    },

    hardDeletePaymentMethod: async (methodId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeletePaymentMethod(storeId, methodId);
            if (error) return error;
            set((s) => ({ paymentMethods: s.paymentMethods.filter((m) => m.id !== methodId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el método de pago';
        }
    },

    // ---------------- Ventas ----------------
    loadSales: async (opts) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.salesLoading && !refresh) return;
        if (!refresh && state.salesPagination.isEnd) return;

        set({ salesLoading: true });
        try {
            const cursor = refresh ? null : state.salesPagination.cursor;
            const { error, response } = await salesModuleService.getSales(
                storeId,
                state.salesFilters,
                { take: state.salesPagination.take, cursor }
            );
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                sales: refresh
                    ? data
                    : [...s.sales, ...data.filter((d) => !s.sales.some((x) => x.id === d.id))],
                salesPagination: {
                    ...s.salesPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                salesLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                salesLoading: false,
                error: e?.message ?? 'Error al cargar las ventas',
                salesPagination: { ...s.salesPagination, isEnd: true },
            }));
        }
    },

    fetchSale: async (saleId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return { sale: null, error: 'No hay una tienda seleccionada.' };
        try {
            const { error, response } = await salesModuleService.getSale(storeId, saleId);
            if (error || !response) return { sale: null, error: error ?? 'Venta no encontrada.' };
            return { sale: response, error: null };
        } catch (e: any) {
            return { sale: null, error: e?.message ?? 'Venta no encontrada.' };
        }
    },

    createSale: async (body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.createSale(storeId, body);
            if (error) return error;
            await get().refreshSalesAll();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al registrar la venta';
        }
    },

    updateSale: async (saleId, body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.updateSale(storeId, saleId, body);
            if (error) return error;
            await get().refreshSalesAll();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar la venta';
        }
    },

    deleteSale: async (saleId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.deleteSale(storeId, saleId);
            if (error) return error;
            await get().refreshSalesAll();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la venta';
        }
    },

    restoreSale: async (saleId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.restoreSale(storeId, saleId);
            if (error) return error;
            await get().refreshSalesAll();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar la venta';
        }
    },

    hardDeleteSale: async (saleId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeleteSale(storeId, saleId);
            if (error) return error;
            await get().refreshSalesAll();
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar la venta';
        }
    },

    setSalesFilters: async (patch) => {
        set((s) => ({ salesFilters: { ...s.salesFilters, ...patch } }));
        await get().refreshSalesAll();
    },

    setSeriesPeriod: async (period) => {
        set({ seriesPeriod: period });
        await get().loadSeries();
    },

    refreshSalesAll: async () => {
        await Promise.all([
            get().loadSales({ refresh: true }),
            get().loadSummary(),
            get().loadSeries(),
        ]);
    },

    loadSummary: async () => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        try {
            const { error, response } = await salesModuleService.getSummary(
                storeId,
                get().salesFilters
            );
            if (error) throw new Error(error);
            set({ summary: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar el resumen' });
        }
    },

    loadSeries: async () => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        try {
            const { error, response } = await salesModuleService.getSeries(
                storeId,
                get().salesFilters,
                get().seriesPeriod
            );
            if (error) throw new Error(error);
            set({ series: response ?? null });
        } catch (e: any) {
            set({ error: e?.message ?? 'Error al cargar la serie' });
        }
    },

    // ---------------- Clientes ----------------
    loadCustomers: async (opts) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.customersLoading && !refresh) return;
        if (!refresh && state.customersPagination.isEnd) return;

        set({ customersLoading: true });
        try {
            const cursor = refresh ? null : state.customersPagination.cursor;
            const { error, response } = await salesModuleService.getCustomers(storeId, {
                take: state.customersPagination.take,
                cursor,
                search: state.customersSearch || undefined,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                customers: refresh
                    ? data
                    : [
                          ...s.customers,
                          ...data.filter((d) => !s.customers.some((x) => x.id === d.id)),
                      ],
                customersPagination: {
                    ...s.customersPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                customersLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                customersLoading: false,
                error: e?.message ?? 'Error al cargar los clientes',
                customersPagination: { ...s.customersPagination, isEnd: true },
            }));
        }
    },

    setCustomersSearch: async (search) => {
        // Cambiar la búsqueda reinicia la paginación keyset.
        set((s) => ({
            customersSearch: search,
            customers: [],
            customersPagination: { ...s.customersPagination, cursor: null, isEnd: false },
        }));
        await get().loadCustomers({ refresh: true });
    },

    createCustomer: async (body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) {
            return {
                customer: null,
                linkedExisting: false,
                error: 'No hay una tienda seleccionada.',
            };
        }
        try {
            const { error, response } = await salesModuleService.createCustomer(
                storeId,
                body
            );
            if (error || !response) {
                return {
                    customer: null,
                    linkedExisting: false,
                    error: error ?? 'No se pudo crear el cliente.',
                };
            }
            await get().loadCustomers({ refresh: true });
            return {
                customer: response,
                linkedExisting: response.linked_existing === true,
                error: null,
            };
        } catch (e: any) {
            return {
                customer: null,
                linkedExisting: false,
                error: e?.message ?? 'No se pudo crear el cliente.',
            };
        }
    },

    linkCustomer: async (customerId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.linkCustomer(storeId, customerId);
            if (error) return error;
            await get().loadCustomers({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'No se pudo vincular el cliente';
        }
    },

    updateCustomer: async (customerId, body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error, response } = await salesModuleService.updateCustomer(
                storeId,
                customerId,
                body
            );
            if (error) return error;
            set((s) => ({
                customers: s.customers.map((c) =>
                    c.id === customerId && response ? { ...c, ...response } : c
                ),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al actualizar el cliente';
        }
    },

    unlinkCustomer: async (customerId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.unlinkCustomer(storeId, customerId);
            if (error) return error;
            set((s) => ({ customers: s.customers.filter((c) => c.id !== customerId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al quitar el cliente';
        }
    },

    hardDeleteCustomer: async (customerId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeleteCustomer(
                storeId,
                customerId
            );
            if (error) return error;
            set((s) => ({ customers: s.customers.filter((c) => c.id !== customerId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el cliente';
        }
    },

    fetchCustomerStats: async (customerId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return { stats: null, error: 'No hay una tienda seleccionada.' };
        try {
            const { error, response } = await salesModuleService.getCustomerStats(
                storeId,
                customerId
            );
            if (error || !response) {
                return {
                    stats: null,
                    error: error ?? 'No se pudieron cargar las estadísticas.',
                };
            }
            return { stats: response, error: null };
        } catch (e: any) {
            return {
                stats: null,
                error: e?.message ?? 'No se pudieron cargar las estadísticas.',
            };
        }
    },

    // ---------------- Recibos ----------------
    loadReceipts: async (opts) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return;
        const refresh = opts?.refresh ?? false;
        const state = get();
        if (state.receiptsLoading && !refresh) return;
        if (!refresh && state.receiptsPagination.isEnd) return;

        set({ receiptsLoading: true });
        try {
            const cursor = refresh ? null : state.receiptsPagination.cursor;
            const { error, response } = await salesModuleService.getReceipts(storeId, {
                take: state.receiptsPagination.take,
                cursor,
            });
            if (error) throw new Error(error);

            const data = response?.data ?? [];
            const nextCursor = response?.nextCursor ?? null;
            set((s) => ({
                receipts: refresh
                    ? data
                    : [
                          ...s.receipts,
                          ...data.filter((d) => !s.receipts.some((x) => x.id === d.id)),
                      ],
                receiptsPagination: {
                    ...s.receiptsPagination,
                    cursor: nextCursor,
                    isEnd: nextCursor === null || data.length === 0,
                },
                receiptsLoading: false,
            }));
        } catch (e: any) {
            set((s) => ({
                receiptsLoading: false,
                error: e?.message ?? 'Error al cargar los recibos',
                receiptsPagination: { ...s.receiptsPagination, isEnd: true },
            }));
        }
    },

    fetchReceipt: async (receiptId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return { receipt: null, error: 'No hay una tienda seleccionada.' };
        try {
            const { error, response } = await salesModuleService.getReceipt(
                storeId,
                receiptId
            );
            if (error || !response) {
                return { receipt: null, error: error ?? 'Recibo no encontrado.' };
            }
            return { receipt: response, error: null };
        } catch (e: any) {
            return { receipt: null, error: e?.message ?? 'Recibo no encontrado.' };
        }
    },

    fetchSaleReceipt: async (saleId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return { receipt: null, error: 'No hay una tienda seleccionada.' };
        try {
            const { error, response } = await salesModuleService.getSaleReceipt(
                storeId,
                saleId
            );
            if (error || !response) {
                return { receipt: null, error: error ?? 'Esta venta no tiene recibo.' };
            }
            return { receipt: response, error: null };
        } catch (e: any) {
            return { receipt: null, error: e?.message ?? 'Esta venta no tiene recibo.' };
        }
    },

    issueReceipt: async (saleId, body) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return { receipt: null, error: 'No hay una tienda seleccionada.' };
        try {
            const { error, response } = await salesModuleService.issueReceipt(
                storeId,
                saleId,
                body
            );
            if (error || !response) {
                return { receipt: null, error: error ?? 'No se pudo emitir el recibo.' };
            }
            await get().loadReceipts({ refresh: true });
            return { receipt: response, error: null };
        } catch (e: any) {
            return { receipt: null, error: e?.message ?? 'No se pudo emitir el recibo.' };
        }
    },

    deleteReceipt: async (receiptId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.deleteReceipt(storeId, receiptId);
            if (error) return error;
            set((s) => ({ receipts: s.receipts.filter((r) => r.id !== receiptId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el recibo';
        }
    },

    restoreReceipt: async (receiptId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.restoreReceipt(storeId, receiptId);
            if (error) return error;
            await get().loadReceipts({ refresh: true });
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al restaurar el recibo';
        }
    },

    hardDeleteReceipt: async (receiptId) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error } = await salesModuleService.hardDeleteReceipt(storeId, receiptId);
            if (error) return error;
            set((s) => ({ receipts: s.receipts.filter((r) => r.id !== receiptId) }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al eliminar el recibo';
        }
    },

    updateReceipt: async (receiptId, customerName) => {
        const storeId = get().currentStore?.id;
        if (!storeId) return 'No hay una tienda seleccionada.';
        try {
            const { error, response } = await salesModuleService.updateReceipt(
                storeId,
                receiptId,
                { customer_name: customerName }
            );
            if (error) return error;
            set((s) => ({
                receipts: s.receipts.map((r) =>
                    r.id === receiptId && response ? { ...r, ...response } : r
                ),
            }));
            return null;
        } catch (e: any) {
            return e?.message ?? 'Error al corregir el recibo';
        }
    },

    // ---------------- Invitaciones por QR ----------------
    generateInvite: async (storeId) => {
        try {
            const { error, response } = await salesModuleService.generateInvite(storeId);
            if (error || !response) {
                return { invite: null, error: error ?? 'No se pudo generar la invitación.' };
            }
            return { invite: response, error: null };
        } catch (e: any) {
            return { invite: null, error: e?.message ?? 'No se pudo generar la invitación.' };
        }
    },

    revokeInvite: async (storeId) => {
        try {
            const { error } = await salesModuleService.revokeInvite(storeId);
            return error;
        } catch (e: any) {
            return e?.message ?? 'No se pudo revocar la invitación.';
        }
    },

    fetchInviteInfo: async (token) => {
        try {
            const { error, response, httpError } = await salesModuleService.getInviteInfo(token);
            const status = httpError?.status ?? null;
            if (error || !response) {
                return {
                    info: null,
                    error: inviteErrorForStatus(status) ?? error ?? 'Invitación no válida.',
                };
            }
            return { info: response, error: null };
        } catch (e: any) {
            return { info: null, error: e?.message ?? 'Invitación no válida.' };
        }
    },

    acceptInvite: async (token) => {
        try {
            const { error, response, httpError } = await salesModuleService.acceptInvite(token);
            const status = httpError?.status ?? null;
            if (error || !response) {
                return {
                    ok: false,
                    storeId: null,
                    error: inviteErrorForStatus(status) ?? error ?? 'No se pudo aceptar la invitación.',
                };
            }
            return { ok: true, storeId: response.store_id ?? null, error: null };
        } catch (e: any) {
            return { ok: false, storeId: null, error: e?.message ?? 'No se pudo aceptar la invitación.' };
        }
    },
}));
