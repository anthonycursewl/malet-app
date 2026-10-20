import { MALET_API_URL } from '../../config/malet.config';
import {
    CursorList,
    Customer,
    CustomerInput,
    CustomerStats,
    Invoice,
    InvoiceInput,
    InvoicePayInput,
    InvoicePaymentResult,
    InvoiceStatus,
    InvoiceTotals,
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
    StoreReceiptMode,
    StoreInvite,
    StoreInviteInfo,
    StoreMember,
    StoreNotificationGroup,
    StoreNotificationsConfig,
    StoreProduct,
    StorePhotoEditMode,
    StorePhotoKind,
} from '../../entities/SalesModule';
import { secureFetch, SecureFetchResponse } from '../../http/secureFetch';
import { uploadWithXhr } from '../../http/uploadWithXhr';

const STORES = `${MALET_API_URL}/stores`;
const STORE_INVITES = `${MALET_API_URL}/store-invites`;

type QueryValue = string | number | boolean | null | undefined;

export interface ListQuery {
    take?: number;
    cursor?: string | null;
}

/** Query string omitiendo null/undefined/vacíos. */
function qs(params: Record<string, QueryValue>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        search.append(key, String(value));
    }
    const str = search.toString();
    return str ? `?${str}` : '';
}

function listParams(q?: ListQuery): Record<string, QueryValue> {
    return { take: q?.take, cursor: q?.cursor ?? undefined };
}

/** Filtros compartidos: un `to` date-only (YYYY-MM-DD) incluye todo el día. */
function filterParams(filters?: SalesFilters | null): Record<string, QueryValue> {
    if (!filters) return {};
    return {
        preset: filters.preset ?? undefined,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
        product_id: filters.product_id ?? undefined,
        payment_method_id: filters.payment_method_id ?? undefined,
    };
}

const storeBase = (storeId: string) => `${STORES}/${storeId}`;

/**
 * Peticiones cuya respuesta puede venir vacía (DELETE / restore).
 * La capa http reporta un 2xx sin body como EMPTY_RESPONSE: no es un fallo.
 */
async function requestVoid<T = unknown>(opts: {
    url: string;
    method: 'DELETE' | 'PUT' | 'POST';
}): Promise<SecureFetchResponse<T>> {
    const res = await secureFetch<T>(opts);
    if (res.httpError?.code === 'EMPTY_RESPONSE') {
        return { error: null, response: null, httpError: null };
    }
    return res;
}

/** Mensajes amigables para los estados propios de las invitaciones (contrato). */
export function inviteErrorForStatus(status?: number | null): string | null {
    if (status === 410) return 'La invitación expiró, ya fue usada o fue revocada. Escanea un QR nuevo.';
    if (status === 409) return 'Ya eres miembro de esta tienda.';
    if (status === 404) return 'Invitación no válida o la tienda ya no existe.';
    if (status === 401) return 'Tu sesión ha expirada. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permiso para realizar esta acción.';
    return null;
}

export const salesModuleService = {
    // ---------- Tiendas ----------
    getStores: (q?: ListQuery): Promise<SecureFetchResponse<CursorList<SalesStore>>> =>
        secureFetch<CursorList<SalesStore>>({
            url: `${STORES}${qs(listParams(q))}`,
            method: 'GET',
        }),

    getStore: (storeId: string): Promise<SecureFetchResponse<SalesStore>> =>
        secureFetch<SalesStore>({ url: storeBase(storeId), method: 'GET' }),

    createStore: (body: {
        name: string;
        currency: StoreCurrency;
    }): Promise<SecureFetchResponse<SalesStore>> =>
        secureFetch<SalesStore>({ url: STORES, method: 'POST', body }),

    updateStore: (
        storeId: string,
        body: {
            name?: string;
            currency?: StoreCurrency;
            phone?: string | null;
            email?: string | null;
            address?: string | null;
            receipt_mode?: StoreReceiptMode;
            avatar_edit_mode?: StorePhotoEditMode;
            banner_edit_mode?: StorePhotoEditMode;
        },
    ): Promise<SecureFetchResponse<SalesStore>> =>
        secureFetch<SalesStore>({ url: storeBase(storeId), method: 'PUT', body }),

    /**
     * Sube la foto de la tienda (avatar o banner). El cliente acota la imagen
     * antes de subirla y el servidor genera las 3 resoluciones.
     */
    uploadStorePhoto: (
        storeId: string,
        kind: StorePhotoKind,
        file: { uri: string; name: string; type: string },
        onProgress?: (ratio: number) => void,
    ): Promise<SecureFetchResponse<SalesStore>> => {
        const formData = new FormData();
        formData.append('photo', file as any);

        return uploadWithXhr<SalesStore>(`${storeBase(storeId)}/${kind}`, formData, {
            method: 'PUT',
            onProgress,
        });
    },

    // ---------- Avisos por email ----------
    /** Configuración de avisos de la tienda (**solo el dueño**). */
    getStoreNotifications: (storeId: string): Promise<SecureFetchResponse<StoreNotificationsConfig>> =>
        secureFetch<StoreNotificationsConfig>({
            url: `${storeBase(storeId)}/notifications`,
            method: 'GET',
        }),

    /** Guarda los grupos activos y los miembros seleccionados (**solo el dueño**). */
    updateStoreNotifications: (
        storeId: string,
        body: {
            events?: Partial<Record<StoreNotificationGroup, boolean>>;
            digest?: boolean;
            member_ids?: string[];
        },
    ): Promise<SecureFetchResponse<StoreNotificationsConfig>> =>
        secureFetch<StoreNotificationsConfig>({
            url: `${storeBase(storeId)}/notifications`,
            method: 'PUT',
            body,
        }),

    deleteStore: (storeId: string) => requestVoid({ url: storeBase(storeId), method: 'DELETE' }),
    restoreStore: (storeId: string) => requestVoid({ url: `${storeBase(storeId)}/restore`, method: 'PUT' }),

    hardDeleteStore: (storeId: string) =>
        requestVoid({ url: `${storeBase(storeId)}/hard`, method: 'DELETE' }),

    // ---------- Miembros ----------
    getMembers: (storeId: string, q?: ListQuery): Promise<SecureFetchResponse<CursorList<StoreMember>>> =>
        secureFetch<CursorList<StoreMember>>({
            url: `${storeBase(storeId)}/members${qs(listParams(q))}`,
            method: 'GET',
        }),

    addMember: (storeId: string, userId: string): Promise<SecureFetchResponse<StoreMember>> =>
        secureFetch<StoreMember>({
            url: `${storeBase(storeId)}/members`,
            method: 'POST',
            body: { user_id: userId },
        }),

    removeMember: (storeId: string, memberId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/members/${memberId}`,
            method: 'DELETE',
        }),

    restoreMember: (storeId: string, memberId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/members/${memberId}/restore`,
            method: 'PUT',
        }),

    hardDeleteMember: (storeId: string, memberId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/members/${memberId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Productos ----------
    getProducts: (storeId: string, q?: ListQuery) =>
        secureFetch<CursorList<StoreProduct>>({
            url: `${storeBase(storeId)}/products${qs(listParams(q))}`,
            method: 'GET',
        }),

    getProduct: (storeId: string, productId: string) =>
        secureFetch<StoreProduct>({
            url: `${storeBase(storeId)}/products/${productId}`,
            method: 'GET',
        }),

    createProduct: (
        storeId: string,
        body: { name: string; cost: number; pvp: number },
    ): Promise<SecureFetchResponse<StoreProduct>> =>
        secureFetch<StoreProduct>({
            url: `${storeBase(storeId)}/products`,
            method: 'POST',
            body,
        }),

    updateProduct: (
        storeId: string,
        productId: string,
        body: Partial<{ name: string; cost: number; pvp: number }>,
    ): Promise<SecureFetchResponse<StoreProduct>> =>
        secureFetch<StoreProduct>({
            url: `${storeBase(storeId)}/products/${productId}`,
            method: 'PUT',
            body,
        }),

    deleteProduct: (storeId: string, productId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/products/${productId}`,
            method: 'DELETE',
        }),

    restoreProduct: (storeId: string, productId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/products/${productId}/restore`,
            method: 'PUT',
        }),

    hardDeleteProduct: (storeId: string, productId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/products/${productId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Métodos de pago ----------
    getPaymentMethods: (storeId: string) =>
        secureFetch<CursorList<PaymentMethod>>({
            url: `${storeBase(storeId)}/payment-methods`,
            method: 'GET',
        }),

    createPaymentMethod: (storeId: string, name: string) =>
        secureFetch<PaymentMethod>({
            url: `${storeBase(storeId)}/payment-methods`,
            method: 'POST',
            body: { name },
        }),

    updatePaymentMethod: (storeId: string, methodId: string, body: { name?: string; active?: boolean }) =>
        secureFetch<PaymentMethod>({
            url: `${storeBase(storeId)}/payment-methods/${methodId}`,
            method: 'PUT',
            body,
        }),

    deletePaymentMethod: (storeId: string, methodId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/payment-methods/${methodId}`,
            method: 'DELETE',
        }),

    restorePaymentMethod: (storeId: string, methodId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/payment-methods/${methodId}/restore`,
            method: 'PUT',
        }),

    hardDeletePaymentMethod: (storeId: string, methodId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/payment-methods/${methodId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Ventas ----------
    getSales: (storeId: string, filters: SalesFilters | null | undefined, q?: ListQuery) =>
        secureFetch<CursorList<Sale>>({
            url: `${storeBase(storeId)}/sales${qs({ ...listParams(q), ...filterParams(filters) })}`,
            method: 'GET',
        }),

    getSale: (storeId: string, saleId: string) =>
        secureFetch<Sale>({
            url: `${storeBase(storeId)}/sales/${saleId}`,
            method: 'GET',
        }),

    createSale: (storeId: string, body: SaleInput) =>
        secureFetch<Sale & { receipt: Receipt | null }>({
            url: `${storeBase(storeId)}/sales`,
            method: 'POST',
            body,
        }),

    updateSale: (storeId: string, saleId: string, body: Partial<SaleInput>) =>
        secureFetch<Sale>({
            url: `${storeBase(storeId)}/sales/${saleId}`,
            method: 'PUT',
            body,
        }),

    deleteSale: (storeId: string, saleId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/sales/${saleId}`,
            method: 'DELETE',
        }),

    restoreSale: (storeId: string, saleId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/sales/${saleId}/restore`,
            method: 'PUT',
        }),

    hardDeleteSale: (storeId: string, saleId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/sales/${saleId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Recibos ----------
    getReceipts: (storeId: string, q?: ListQuery) =>
        secureFetch<CursorList<Receipt>>({
            url: `${storeBase(storeId)}/receipts${qs(listParams(q))}`,
            method: 'GET',
        }),

    getReceipt: (storeId: string, receiptId: string) =>
        secureFetch<Receipt>({
            url: `${storeBase(storeId)}/receipts/${receiptId}`,
            method: 'GET',
        }),

    /** Recibo de una venta (404 si no tiene). */
    getSaleReceipt: (storeId: string, saleId: string) =>
        secureFetch<Receipt>({
            url: `${storeBase(storeId)}/sales/${saleId}/receipt`,
            method: 'GET',
        }),

    /** Emite el recibo de una venta existente (idempotente). */
    issueReceipt: (storeId: string, saleId: string, body?: { customer_name?: string }) =>
        secureFetch<Receipt>({
            url: `${storeBase(storeId)}/receipts/sales/${saleId}`,
            method: 'POST',
            body: body ?? {},
        }),

    deleteReceipt: (storeId: string, receiptId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/receipts/${receiptId}`,
            method: 'DELETE',
        }),

    /** Corrección auditada del "Facturar a" (los importes no cambian). */
    updateReceipt: (storeId: string, receiptId: string, body: { customer_name: string | null }) =>
        secureFetch<Receipt>({
            url: `${storeBase(storeId)}/receipts/${receiptId}`,
            method: 'PUT',
            body,
        }),

    restoreReceipt: (storeId: string, receiptId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/receipts/${receiptId}/restore`,
            method: 'PUT',
        }),

    hardDeleteReceipt: (storeId: string, receiptId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/receipts/${receiptId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Facturas ----------
    /** Facturas de la tienda (keyset por fecha de emisión). */
    getInvoices: (
        storeId: string,
        filters: { status?: InvoiceStatus; customer_id?: string } | null | undefined,
        q?: ListQuery,
    ) =>
        secureFetch<CursorList<Invoice>>({
            url: `${storeBase(storeId)}/invoices${qs({
                ...listParams(q),
                status: filters?.status,
                customer_id: filters?.customer_id,
            })}`,
            method: 'GET',
        }),

    getInvoice: (storeId: string, invoiceId: string) =>
        secureFetch<Invoice>({
            url: `${storeBase(storeId)}/invoices/${invoiceId}`,
            method: 'GET',
        }),

    /** Totales "por cobrar" vs pagados. */
    getInvoiceTotals: (storeId: string) =>
        secureFetch<InvoiceTotals>({
            url: `${storeBase(storeId)}/invoices/summary`,
            method: 'GET',
        }),

    /** Crea la factura en estado `pending` (no genera venta ni recibo). */
    createInvoice: (storeId: string, body: InvoiceInput) =>
        secureFetch<Invoice>({
            url: `${storeBase(storeId)}/invoices`,
            method: 'POST',
            body,
        }),

    updateInvoice: (storeId: string, invoiceId: string, body: Partial<InvoiceInput>) =>
        secureFetch<Invoice>({
            url: `${storeBase(storeId)}/invoices/${invoiceId}`,
            method: 'PUT',
            body,
        }),

    cancelInvoice: (storeId: string, invoiceId: string) =>
        secureFetch<Invoice>({
            url: `${storeBase(storeId)}/invoices/${invoiceId}/cancel`,
            method: 'POST',
        }),

    /** Paga la factura: crea la venta y emite el recibo en ese momento. */
    payInvoice: (storeId: string, invoiceId: string, body: InvoicePayInput) =>
        secureFetch<InvoicePaymentResult>({
            url: `${storeBase(storeId)}/invoices/${invoiceId}/pay`,
            method: 'POST',
            body,
        }),

    deleteInvoice: (storeId: string, invoiceId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/invoices/${invoiceId}`,
            method: 'DELETE',
        }),

    // ---------- Clientes ----------
    /** Listado keyset: `cursor` es el `seq` del último cliente de la página previa. */
    getCustomers: (storeId: string, q?: { take?: number; cursor?: string | null; search?: string }) =>
        secureFetch<CursorList<Customer>>({
            url: `${storeBase(storeId)}/customers${qs({
                take: q?.take,
                cursor: q?.cursor,
                search: q?.search,
            })}`,
            method: 'GET',
        }),

    createCustomer: (storeId: string, body: CustomerInput) =>
        secureFetch<Customer & { linked_existing: boolean }>({
            url: `${storeBase(storeId)}/customers`,
            method: 'POST',
            body,
        }),

    /** Comparte un cliente existente con la tienda (por su ID). */
    linkCustomer: (storeId: string, customerId: string) =>
        secureFetch<Customer>({
            url: `${storeBase(storeId)}/customers/link`,
            method: 'POST',
            body: { customer_id: customerId },
        }),

    getCustomer: (storeId: string, customerId: string) =>
        secureFetch<Customer>({
            url: `${storeBase(storeId)}/customers/${customerId}`,
            method: 'GET',
        }),

    getCustomerStats: (storeId: string, customerId: string) =>
        secureFetch<CustomerStats>({
            url: `${storeBase(storeId)}/customers/${customerId}/stats`,
            method: 'GET',
        }),

    updateCustomer: (storeId: string, customerId: string, body: Partial<CustomerInput>) =>
        secureFetch<Customer>({
            url: `${storeBase(storeId)}/customers/${customerId}`,
            method: 'PUT',
            body,
        }),

    /** Quita el cliente de esta tienda (otras tiendas conservan su vínculo). */
    unlinkCustomer: (storeId: string, customerId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/customers/${customerId}`,
            method: 'DELETE',
        }),

    hardDeleteCustomer: (storeId: string, customerId: string) =>
        requestVoid({
            url: `${storeBase(storeId)}/customers/${customerId}/hard`,
            method: 'DELETE',
        }),

    // ---------- Reportes ----------
    getSummary: (storeId: string, filters: SalesFilters | null | undefined) =>
        secureFetch<SalesSummary>({
            url: `${storeBase(storeId)}/sales/summary${qs(filterParams(filters))}`,
            method: 'GET',
        }),

    getSeries: (storeId: string, filters: SalesFilters | null | undefined, period: SeriesPeriod) =>
        secureFetch<SalesSeries>({
            url: `${storeBase(storeId)}/sales/series${qs({ period, ...filterParams(filters) })}`,
            method: 'GET',
        }),

    // ---------- Invitaciones por QR (tipo WhatsApp Web) ----------
    /** Genera/rota el QR (solo el dueño). Cada llamada revoca los anteriores. */
    generateInvite: (storeId: string) =>
        secureFetch<StoreInvite>({
            url: `${storeBase(storeId)}/invites`,
            method: 'POST',
        }),

    /** Revoca el QR vigente sin generar uno nuevo (solo el dueño). */
    revokeInvite: (storeId: string) =>
        requestVoid({ url: `${storeBase(storeId)}/invites`, method: 'DELETE' }),

    /** Datos de la pantalla de consentimiento (requiere login). */
    getInviteInfo: (token: string) =>
        secureFetch<StoreInviteInfo>({
            url: `${STORE_INVITES}/${encodeURIComponent(token)}`,
            method: 'GET',
        }),

    /** Acepta la invitación: entra como miembro y consume el token (uso único). */
    acceptInvite: (token: string) =>
        secureFetch<StoreMember>({
            url: `${STORE_INVITES}/${encodeURIComponent(token)}/accept`,
            method: 'POST',
        }),
};
