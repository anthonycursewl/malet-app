/**
 * Entidades del módulo Cuaderno de Ventas (SalesModule).
 * Contrato API: `/stores/...` y `/store-invite/...` con Bearer JWT.
 */

/** Respuesta de listados con paginación por cursor. */
export interface CursorList<T> {
    data: T[];
    nextCursor: string | null;
}

/** Monedas admitidas por el contrato (`currency` es obligatoria en la tienda). */
export type StoreCurrency = 'Bs' | 'USD' | 'COP';

export const STORE_CURRENCIES: StoreCurrency[] = ['Bs', 'USD', 'COP'];

/** Política de recibos de la tienda (solo el dueño puede cambiarla). */
export type StoreReceiptMode = 'ask' | 'always' | 'never';

/** Tipo de foto de la tienda. */
export type StorePhotoKind = 'avatar' | 'banner';

/** Quién puede cambiar las fotos de la tienda (lo decide el dueño). */
export type StorePhotoEditMode = 'owner' | 'members';

export const STORE_PHOTO_EDIT_OPTIONS: {
    value: StorePhotoEditMode;
    label: string;
}[] = [
    { value: 'owner', label: 'Solo el dueño' },
    { value: 'members', label: 'Todos los miembros' },
];
/** Resoluciones que genera el backend para cada foto. */
export type StorePhotoSize = 'small' | 'medium' | 'large';

/**
 * Ancho máximo que el cliente envía al servidor (px). El backend genera las 3
 * resoluciones a partir de esa imagen, así que no se sube de más.
 */
export const STORE_PHOTO_UPLOAD_WIDTH: Record<StorePhotoKind, number> = {
    avatar: 512,
    banner: 1600,
};

/** Proporción de recorte de cada foto (la del avatar es cuadrada). */
export const STORE_PHOTO_ASPECT: Record<StorePhotoKind, [number, number]> = {
    avatar: [1, 1],
    banner: [16, 9],
};

/** Grupos de avisos por email de la tienda (solo el dueño los cambia). */
export type StoreNotificationGroup = 'sales' | 'receipts' | 'store' | 'members';

export const NOTIFICATION_GROUP_OPTIONS: {
    value: StoreNotificationGroup;
    label: string;
    description: string;
}[] = [
    {
        value: 'sales',
        label: 'Ventas',
        description: 'Venta registrada, editada o eliminada.',
    },
    {
        value: 'receipts',
        label: 'Recibos',
        description: 'Recibo emitido, corregido o eliminado.',
    },
    {
        value: 'store',
        label: 'Tienda',
        description: 'Cambios en la configuración de la tienda.',
    },
    {
        value: 'members',
        label: 'Miembros',
        description: 'Altas y bajas de miembros de la tienda.',
    },
];

/** Miembro destinatario de los avisos (su email solo lo ve el dueño). */
export interface StoreNotificationMember {
    user_id: string;
    name: string | null;
    /** Foto de perfil: identifica al miembro de un vistazo. */
    avatar_url: string | null;
    email: string;
    notify: boolean;
}

/** Configuración de avisos por email de una tienda. */
export interface StoreNotificationsConfig {
    events: Record<StoreNotificationGroup, boolean>;
    /** Resumen diario de las ventas del día. */
    digest: boolean;
    members: StoreNotificationMember[];
}

export const RECEIPT_MODE_OPTIONS: {
    value: StoreReceiptMode;
    label: string;
    description: string;
}[] = [
    {
        value: 'ask',
        label: 'Preguntar',
        description: 'En cada venta se pregunta si se genera el recibo.',
    },
    {
        value: 'always',
        label: 'Generar siempre',
        description: 'Toda venta emite su recibo automáticamente.',
    },
    {
        value: 'never',
        label: 'No generar',
        description: 'Las ventas no emiten recibo.',
    },
];

/** Tienda del cuaderno de ventas. `user_id` es el dueño. */
export interface SalesStore {
    id: string;
    name: string;
    user_id: string;
    /** Moneda de todos los montos de la tienda (sin conversión en reportes). */
    currency?: StoreCurrency;
    /** Datos de contacto que se imprimen en el recibo. */
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    /** Política de recibos: `ask` | `always` | `never`. */
    receipt_mode?: StoreReceiptMode;
    /** Foto de perfil en 3 resoluciones (las genera el servidor). */
    avatar_small_url?: string | null;
    avatar_medium_url?: string | null;
    avatar_large_url?: string | null;
    /** Banner en 3 resoluciones (las genera el servidor). */
    banner_small_url?: string | null;
    banner_medium_url?: string | null;
    banner_large_url?: string | null;
    /** Quién puede cambiar la foto de perfil: `owner` | `members`. */
    avatar_edit_mode?: StorePhotoEditMode;
    /** Quién puede cambiar el banner: `owner` | `members`. */
    banner_edit_mode?: StorePhotoEditMode;
    member_count?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/**
 * URL de una foto de la tienda para la resolución pedida, cayendo a la más
 * cercana disponible (nunca a una resolución mayor de la necesaria).
 */
export function storePhotoUrl(
    store: SalesStore | null | undefined,
    kind: StorePhotoKind,
    size: StorePhotoSize = 'medium',
): string | null {
    if (!store) return null;

    const fallback: Record<StorePhotoSize, StorePhotoSize[]> = {
        small: ['small', 'medium', 'large'],
        medium: ['medium', 'large', 'small'],
        large: ['large', 'medium', 'small'],
    };

    for (const candidate of fallback[size]) {
        const url = store[`${kind}_${candidate}_url`];
        if (url) return url;
    }

    return null;
}

export interface StoreMemberUser {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    avatar_url?: string | null;
}

/** Miembro activo de una tienda (solo la info que la lista necesita). */
export interface StoreMember {
    id: string;
    store_id?: string;
    user_id: string;
    added_by?: string | null;
    created_by?: string | null;
    created_at?: string;
    deleted_at?: string | null;
    /** Cursor keyset del vínculo (autoincremental por tienda). */
    seq?: number;
    /** Nombre del usuario (viene resuelto por el backend). */
    name?: string | null;
    avatar_url?: string | null;
    /** Portada decorativa del card del miembro. */
    banner_url?: string | null;
    verified?: boolean;
    /** Tipo de verificación: `main`, `business`, `ai`, `org`, ... */
    verification_type?: string | null;
    user?: StoreMemberUser | null;
}

/** Producto con costo (cost) y precio de venta (pvp). */
export interface StoreProduct {
    id: string;
    store_id?: string;
    name: string;
    cost: number;
    pvp: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/** Método de pago de la tienda (inactivo ≠ borrado). */
export interface PaymentMethod {
    id: string;
    store_id?: string;
    name: string;
    active: boolean;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/** Tipo de línea de venta: producto del catálogo o concepto libre (servicio). */
export type SaleItemType = 'product' | 'service';

/** Línea de una venta: un producto o un concepto libre (snapshot de precios). */
export interface SaleItem {
    id: string;
    /** `null` en conceptos libres (servicios sin producto). */
    product_id: string | null;
    /** Snapshot del nombre (producto o servicio). */
    name?: string;
    item_type?: SaleItemType;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    /** Alias heredado del nombre resuelto por el backend. */
    product_name?: string;
}

/**
 * Línea enviada al registrar/editar una venta o factura.
 * - Producto: `{ product_id, quantity?, unit_price?, unit_cost? }`.
 * - Concepto libre: `{ name, unit_price, quantity?, unit_cost? }`.
 */
export interface SaleItemInput {
    product_id?: string | null;
    name?: string;
    item_type?: SaleItemType;
    quantity?: number;
    unit_price?: number;
    unit_cost?: number;
}

/** Venta registrada. `total` y `profit` los calcula el backend. */
export interface Sale {
    id: string;
    store_id?: string;
    payment_method_id?: string | null;
    /** Cliente opcional de la venta (identidad compartida entre tiendas). */
    customer_id?: string | null;
    /** Productos vendidos (una línea por producto). */
    items: SaleItem[];
    sold_at: string;
    total?: number;
    profit?: number;
    /** Referencia informativa en otra moneda (nunca participa en cálculos ni reportes). */
    reference_currency?: StoreCurrency | null;
    reference_amount?: number | null;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/** Body de POST /sales (defaults en el backend: qty 1, price=pvp, cost=cost, sold_at=ahora). */
export interface SaleInput {
    items: SaleItemInput[];
    payment_method_id?: string | null;
    customer_id?: string | null;
    /**
     * Par obligatorio (ambos o ninguno). En PUT, `null`/`null` limpia la referencia
     * y omitirlos no la modifica.
     */
    reference_currency?: StoreCurrency | null;
    reference_amount?: number | null;
    sold_at?: string;
    /** Al habilitarlo, la venta y su recibo se registran en la misma petición. */
    receipt?: SaleReceiptInput;
}

export type SalesDatePreset =
    | 'today'
    | 'yesterday'
    | 'this_week'
    | 'last_week'
    | 'this_month'
    | 'last_month'
    | 'last_7_days'
    | 'last_30_days'
    | 'this_year';

/** Presets admitidos por el contrato (fuente de verdad de validez). */
export const SALES_DATE_PRESETS: SalesDatePreset[] = [
    'today',
    'yesterday',
    'this_week',
    'last_week',
    'this_month',
    'last_month',
    'last_7_days',
    'last_30_days',
    'this_year',
];

/** Valida un valor guardado en el dispositivo antes de usarlo como filtro. */
export function isSalesDatePreset(value: unknown): value is SalesDatePreset {
    return typeof value === 'string' && (SALES_DATE_PRESETS as string[]).includes(value);
}

/** Filtros compartidos entre /sales, /summary y /series. */
export interface SalesFilters {
    preset?: SalesDatePreset | null;
    from?: string | null;
    to?: string | null;
    product_id?: string | null;
    payment_method_id?: string | null;
}

/** GET /sales/summary */
export interface SalesSummary {
    sales_count: number;
    units_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    average_ticket: number;
    range?: { from: string; to: string };
}

export type SeriesPeriod = 'day' | 'week' | 'month';

/** Bucket de la serie temporal (date_trunc). */
export interface SeriesBucket {
    bucket: string;
    sales_count: number;
    units_sold: number;
    revenue: number;
    cost: number;
    profit: number;
}

/** GET /sales/series */
export interface SalesSeries {
    period: SeriesPeriod;
    from?: string;
    to?: string;
    data: SeriesBucket[];
}

/** Línea imprimible de un recibo (snapshot inmutable). */
export interface ReceiptLine {
    /** `null` en conceptos libres (servicios sin producto). */
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    total: number;
}

/** Entrada del historial de pagos del recibo. */
export interface ReceiptPayment {
    payment_method_id?: string | null;
    payment_method_name?: string | null;
    amount: number;
    paid_at: string;
}

/**
 * Recibo emitido a partir de una venta (`sale_id` único: un recibo por venta).
 * Todos los importes son un snapshot del momento de emisión.
 */
export interface Receipt {
    id: string;
    store_id: string;
    sale_id: string;
    sequence: number;
    year: number;
    /** Folio completo, ej: `R-BRD-2026-000123`. */
    number: string;
    customer_name?: string | null;
    currency: StoreCurrency;
    /** Datos del emisor congelados al emitir el recibo (inmutables). */
    store_name?: string | null;
    store_phone?: string | null;
    store_email?: string | null;
    store_address?: string | null;
    subtotal: number;
    total: number;
    paid_amount: number;
    lines: ReceiptLine[];
    payments: ReceiptPayment[];
    issued_at: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    /** Token HMAC para la verificación pública del folio. */
    verify_token?: string;
    /** Auditoría de la corrección del "Facturar a". */
    customer_name_updated_at?: string | null;
    customer_name_updated_by?: string | null;
}

/** Datos opcionales al emitir un recibo junto con la venta. */
export interface SaleReceiptInput {
    enabled: boolean;
    customer_name?: string;
}

// ---------- Facturas (documento previo al pago) ----------

export type InvoiceStatus = 'pending' | 'paid' | 'cancelled';

export const INVOICE_STATUS_OPTIONS: {
    value: InvoiceStatus;
    label: string;
    color: string;
}[] = [
    { value: 'pending', label: 'Pendiente', color: '#b45309' },
    { value: 'paid', label: 'Pagada', color: '#15803d' },
    { value: 'cancelled', label: 'Cancelada', color: '#6b7280' },
];

export const invoiceStatusLabel = (status: InvoiceStatus): string =>
    INVOICE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

/** Línea imprimible de una factura (snapshot al crearla). */
export interface InvoiceLine {
    product_id: string | null;
    name: string;
    item_type: SaleItemType;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    total: number;
}

/**
 * Factura: desglose de lo que se cobrará. No afecta ingresos ni emite recibo
 * hasta que se paga (`pay` crea la venta y el recibo en ese momento).
 */
export interface Invoice {
    id: string;
    store_id?: string;
    customer_id?: string | null;
    customer_name?: string | null;
    sequence: number;
    year: number;
    /** Folio completo, ej: `F-BRD-2026-000001`. */
    number: string;
    currency: StoreCurrency;
    subtotal: number;
    total: number;
    notes?: string | null;
    status: InvoiceStatus;
    issued_at: string;
    due_at?: string | null;
    paid_at?: string | null;
    payment_method_id?: string | null;
    /** Venta creada al pagar (null mientras está pendiente). */
    sale_id?: string | null;
    /** Recibo emitido al pagar (null mientras está pendiente). */
    receipt_id?: string | null;
    lines: InvoiceLine[];
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/** Body de POST/PUT /invoices (mismas líneas que una venta). */
export interface InvoiceInput {
    items: SaleItemInput[];
    customer_id?: string | null;
    /** "Facturar a" (puede ser distinto del cliente o no existir como cliente). */
    customer_name?: string | null;
    notes?: string | null;
    issued_at?: string;
    due_at?: string | null;
}

/** Body de POST /invoices/:id/pay. */
export interface InvoicePayInput {
    payment_method_id?: string | null;
    paid_at?: string;
    receipt_customer_name?: string;
}

/** Resumen "por cobrar" de la tienda. */
export interface InvoiceTotals {
    pending_count: number;
    pending_total: number;
    paid_count: number;
    paid_total: number;
}

/** Resultado de pagar una factura. */
export interface InvoicePaymentResult {
    invoice: Invoice;
    sale: Sale;
    receipt: Receipt;
}

/**
 * Cliente: identidad **global compartible** entre tiendas. `seq` es la posición
 * del vínculo con la tienda y se usa como cursor keyset de paginación.
 */
export interface Customer {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    /** Cursor de paginación (autoincremental por tienda). */
    seq?: number;
    linked_at?: string;
}

export interface CustomerInput {
    name: string;
    phone?: string;
    email?: string;
}

export interface CustomerTopProduct {
    product_id: string;
    product_name: string;
    units: number;
    revenue: number;
}

export interface CustomerTopPaymentMethod {
    payment_method_id?: string | null;
    name?: string | null;
    sales: number;
}

export interface CustomerWeekdayPoint {
    weekday: number;
    sales: number;
}

export interface CustomerRecentSale {
    id: string;
    sold_at: string;
    total: number;
    items: number;
}

/** Estadísticas del cliente en una tienda (GET /customers/:id/stats). */
export interface CustomerStats {
    purchase_count: number;
    units_bought: number;
    total_spent: number;
    average_ticket: number;
    first_purchase_at: string | null;
    last_purchase_at: string | null;
    /** Días promedio entre compras (null con menos de dos compras). */
    average_days_between: number | null;
    top_products: CustomerTopProduct[];
    top_payment_methods: CustomerTopPaymentMethod[];
    by_weekday: CustomerWeekdayPoint[];
    recent_sales: CustomerRecentSale[];
}

/** POST /stores/:id/invites — QR de invitación con TTL de 60 s. */ export interface StoreInvite {
    token: string;
    qr_payload: string;
    expires_at: string;
}

/** GET /store-invites/:token — datos de la pantalla de consentimiento. */
export interface StoreInviteInfo {
    store: { id: string; name: string };
    inviter: { id: string; name: string; avatar_url?: string | null };
    expires_at: string;
}

/** Total de una línea (usa el valor del backend si viene). */
export const itemTotal = (item: SaleItem): number =>
    Number((item as { total?: number }).total ?? Number(item.unit_price ?? 0) * Number(item.quantity ?? 0));

/** Ganancia de una línea. */
export const itemProfit = (item: SaleItem): number =>
    (Number(item.unit_price ?? 0) - Number(item.unit_cost ?? 0)) * Number(item.quantity ?? 0);

/** Total de una venta (usa el valor del backend o suma sus líneas). */
export const saleTotal = (sale: Sale): number =>
    Number(sale.total ?? (sale.items ?? []).reduce((acc, item) => acc + itemTotal(item), 0));

/** Ganancia de una venta (usa el valor del backend o suma sus líneas). */
export const saleProfit = (sale: Sale): number =>
    Number(sale.profit ?? (sale.items ?? []).reduce((acc, item) => acc + itemProfit(item), 0));

/** Unidades totales de una venta. */
export const saleUnits = (sale: Sale): number =>
    (sale.items ?? []).reduce((acc, item) => acc + Number(item.quantity ?? 0), 0);
