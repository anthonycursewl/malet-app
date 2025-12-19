// ===============================================
// GARZON DASHBOARD INTERFACES
// ===============================================

export interface DashboardData {
    ventasPorTienda: VentasTienda[];
    topClientes: TopCliente[];
    topPagos: TopPago[];
    topProductos: TopProducto[];
    ventasPorDepartamento: VentasDepartamento[];
}

export interface GarzonSession {
    cookies: string;
    xsrfToken: string;
}

export interface GarzonUser {
    id: number;
    name: string;
    email: string;
    username: string;
    [key: string]: any;
}

// --- Entidades Secundarias ---
export interface VentasTienda {
    id: number;
    codigo: number;
    tienda: string;
    canfac: number;
    subtotal: string;
    subtotal_usd: string;
    costo: string;
}

export interface TopCliente {
    idcliente: string;
    razon: string;
    total: string;
}

export interface TopPago {
    denominacion: Denominacion;
    total: string;
}

export interface Denominacion {
    id: number;
    descripcion: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    codigo: number;
    moneda_id: number;
    act_pagos_credito: number;
    codigo_impresora: string;
    igtf: string;
    predeterminado: number;
    denominacion_valida: number;
    flag_vueltos: number;
    flag_descuento: number;
    flag_pos: number;
    orden: number;
    user_created_id: number | null;
    user_updated_id: number | null;
    user_deleted_id: number | null;
    flag_autoservicio: number | null;
}

export interface TopProducto {
    articulo: string;
    cantidad: string;
    total: string;
    costo: string;
    articulos: DetalleArticulo;
}

export interface DetalleArticulo {
    id: number;
    codigo: string;
    descripcion: string;
    descripcion_corta: string;
    foto: string | null;
    peso: string;
    volumen: string;
    presenta_ven: string | null;
    activo: number;
    fechainicio: string;
    fechafinal: string;
    horainicio: string;
    horafinal: string;
    numerodecimales: number;
    precioregulado: number | null;
    teclado: number;
    sundecop: number | null;
    multiplicar: number | null;
    nivelvender: number | null;
    manejalote: number;
    mpps: string | null;
    cpe: string | null;
    color: string;
    unidnegocio_id: number;
    departamento_id: number;
    grupo_id: number;
    subgrupo_id: number;
    fabricante_id: number;
    marca_id: number;
    modelo_id: number;
    tipoarticulo_id: number;
    presentacion_id: number;
    tipopeso_id: number;
    usuario_id: number;
    created_at: string | null;
    updated_at: string;
    deleted_at: string | null;
    talla_id: number | null;
    linea_id: number | null;
    descripresenta_id: number | null;
    cantidadventa: number;
    cantidadbulto: number;
    volumenbulto: number;
    peso_bruto: string;
    impuesto_id: number;
    tasa_id: number;
    descripcionweb: string;
    tasacambio: string;
    art_controlado: number;
    grupconta_vent: string | null;
    grupconta_comp: string | null;
    grupconta_dev_vent: string | null;
    grupconta_dev_comp: string | null;
    maneja_fecha: number;
    art_empaque: number;
    gradosalcohol: string;
    produc_merma: number;
    repite_produc: number;
    categoria_id: number;
    cambio_precio: number;
    cant_vts_mayor: string;
    otros_impuestos_id: number;
    importado: string;
    relacion_entidad: number | null;
    concepto_id: number | null;
    departamento: DepartamentoDetalle;
}

export interface DepartamentoDetalle {
    id: number;
    codigo: string;
    descripcion: string;
    porcentaje: string;
    observacion: string | null;
    unidnegocio_id: number;
    tipcentrocostos_id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    act_distrib: number;
    manejagradosalcohol: number;
    margen_tope: string;
    mg_diferencial: string;
    flag_presupuesto: number;
}

export interface VentasDepartamento {
    dpto_id: number;
    codigo: string;
    descripcion: string;
    cantidad: string;
    total: string;
    costo: string;
}

// --- Garzon Auth Interfaces ---

export interface GarzonCredentials {
    username: string;
    password: string;
}

export interface GarzonAuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    session: GarzonSession | null;
    user: GarzonUser | null;
    dashboardData: DashboardData | null;
    fetchedAt: string | null;
}

/**
 * Respuesta completa del endpoint /complete
 */
export interface GarzonCompleteResponse {
    session: GarzonSession;
    user: GarzonUser;
    dashboard: DashboardData;
    fetchedAt: string;
}
