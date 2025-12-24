/**
 * HttpError - Error universal para peticiones HTTP
 * Maneja todos los tipos de errores de red, timeout, parsing y servidor
 */

export type HttpErrorCode =
    | 'NETWORK'           // Sin conexión a internet
    | 'TIMEOUT'           // La solicitud excedió el tiempo límite
    | 'ABORT'             // La solicitud fue cancelada
    | 'SERVER'            // Error del servidor (4xx, 5xx)
    | 'PARSE'             // Error al parsear la respuesta
    | 'EMPTY_RESPONSE'    // Respuesta vacía del servidor
    | 'UNAUTHORIZED'      // 401 - No autorizado
    | 'FORBIDDEN'         // 403 - Prohibido
    | 'NOT_FOUND'         // 404 - No encontrado
    | 'VALIDATION'        // 422 - Error de validación
    | 'UNKNOWN';          // Error desconocido

export class HttpError extends Error {
    readonly status: number;
    readonly code: HttpErrorCode;
    readonly details?: unknown;
    readonly timestamp: string;

    constructor(
        message: string,
        status: number = 0,
        code: HttpErrorCode = 'UNKNOWN',
        details?: unknown
    ) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();

        // Mantener el stack trace correcto en V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpError);
        }
    }

    // Factory methods para crear errores específicos
    static network(message = 'Sin conexión a internet'): HttpError {
        return new HttpError(message, 0, 'NETWORK');
    }

    static timeout(message = 'La solicitud tardó demasiado tiempo'): HttpError {
        return new HttpError(message, 0, 'TIMEOUT');
    }

    static abort(message = 'La solicitud fue cancelada'): HttpError {
        return new HttpError(message, 0, 'ABORT');
    }

    static parse(message = 'Error al procesar la respuesta del servidor'): HttpError {
        return new HttpError(message, 0, 'PARSE');
    }

    static emptyResponse(message = 'El servidor no devolvió datos'): HttpError {
        return new HttpError(message, 200, 'EMPTY_RESPONSE');
    }

    static unauthorized(message = 'Sesión expirada o no autorizado'): HttpError {
        return new HttpError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message = 'No tienes permisos para esta acción'): HttpError {
        return new HttpError(message, 403, 'FORBIDDEN');
    }

    static notFound(message = 'Recurso no encontrado'): HttpError {
        return new HttpError(message, 404, 'NOT_FOUND');
    }

    static validation(message: string, details?: unknown): HttpError {
        return new HttpError(message, 422, 'VALIDATION', details);
    }

    static server(message: string, status: number, details?: unknown): HttpError {
        return new HttpError(message, status, 'SERVER', details);
    }

    static fromStatus(status: number, message?: string, details?: unknown): HttpError {
        switch (status) {
            case 401:
                return HttpError.unauthorized(message);
            case 403:
                return HttpError.forbidden(message);
            case 404:
                return HttpError.notFound(message);
            case 422:
                return HttpError.validation(message || 'Error de validación', details);
            default:
                return HttpError.server(
                    message || `Error del servidor (${status})`,
                    status,
                    details
                );
        }
    }

    // Helpers para verificar tipo de error
    isNetworkError(): boolean {
        return this.code === 'NETWORK' || this.code === 'TIMEOUT';
    }

    isAuthError(): boolean {
        return this.code === 'UNAUTHORIZED' || this.code === 'FORBIDDEN';
    }

    isServerError(): boolean {
        return this.status >= 500;
    }

    isClientError(): boolean {
        return this.status >= 400 && this.status < 500;
    }

    // Serialización para logs
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            status: this.status,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Tipo de resultado seguro para manejar respuestas sin excepciones
 */
export type HttpResult<T> =
    | { success: true; data: T; error: null }
    | { success: false; data: null; error: HttpError };

/**
 * Configuración para las peticiones HTTP
 */
export interface HttpRequestConfig {
    timeout?: number;           // Timeout en ms (default: 15000)
    retries?: number;           // Número de reintentos (default: 0)
    retryDelay?: number;        // Delay entre reintentos en ms (default: 1000)
}

const DEFAULT_CONFIG: Required<HttpRequestConfig> = {
    timeout: 15000,
    retries: 0,
    retryDelay: 1000,
};

/**
 * Parsea un error desconocido y lo convierte en HttpError
 */
export function parseError(error: unknown): HttpError {
    // Ya es HttpError
    if (error instanceof HttpError) {
        return error;
    }

    // Error estándar de JavaScript
    if (error instanceof Error) {
        // Timeout/Abort
        if (error.name === 'AbortError') {
            return HttpError.timeout();
        }

        // Error de red (TypeError al hacer fetch sin conexión)
        if (error instanceof TypeError) {
            const message = error.message.toLowerCase();
            if (
                message.includes('network') ||
                message.includes('failed to fetch') ||
                message.includes('network request failed')
            ) {
                return HttpError.network();
            }
        }

        // SyntaxError del JSON.parse
        if (error instanceof SyntaxError) {
            return HttpError.parse();
        }

        return new HttpError(error.message, 0, 'UNKNOWN');
    }

    // Error con string
    if (typeof error === 'string') {
        return new HttpError(error, 0, 'UNKNOWN');
    }

    // Error desconocido
    return new HttpError('Error desconocido', 0, 'UNKNOWN');
}

/**
 * Parsea la respuesta HTTP y lanza HttpError si no es exitosa
 */
export async function parseResponse<T>(response: Response): Promise<T> {
    // Intentar parsear el body
    let data: unknown;
    const contentType = response.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const text = await response.text();
            data = text ? JSON.parse(text) : null;
        } else {
            data = await response.text();
        }
    } catch {
        if (!response.ok) {
            throw HttpError.fromStatus(response.status);
        }
        throw HttpError.parse();
    }

    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
        const errorMessage = extractErrorMessage(data) || `Error ${response.status}`;
        throw HttpError.fromStatus(response.status, errorMessage, data);
    }

    // Verificar respuesta vacía
    if (data === null || data === undefined) {
        throw HttpError.emptyResponse();
    }

    return data as T;
}

/**
 * Extrae el mensaje de error de diferentes formatos de respuesta
 */
function extractErrorMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const obj = data as Record<string, unknown>;

    // Formatos comunes de API
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.msg === 'string') return obj.msg;
    if (typeof obj.detail === 'string') return obj.detail;

    // Array de errores
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        const firstError = obj.errors[0];
        if (typeof firstError === 'string') return firstError;
        if (typeof firstError?.message === 'string') return firstError.message;
    }

    return null;
}

/**
 * Crea un AbortController con timeout automático
 */
export function createTimeoutController(
    timeout: number
): { controller: AbortController; cleanup: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return {
        controller,
        cleanup: () => clearTimeout(timeoutId),
    };
}

/**
 * Ejecuta una función y captura errores, devolviendo HttpResult
 */
export async function safeExecute<T>(
    fn: () => Promise<T>
): Promise<HttpResult<T>> {
    try {
        const data = await fn();
        return { success: true, data, error: null };
    } catch (error) {
        return { success: false, data: null, error: parseError(error) };
    }
}

/**
 * Helper para hacer fetch con timeout y reintentos
 */
export async function fetchWithConfig(
    input: RequestInfo | URL,
    init?: RequestInit,
    config?: HttpRequestConfig
): Promise<Response> {
    const { timeout, retries, retryDelay } = { ...DEFAULT_CONFIG, ...config };

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const { controller, cleanup } = createTimeoutController(timeout);

        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            });

            cleanup();
            return response;
        } catch (error) {
            cleanup();
            lastError = parseError(error);

            // No reintentar si fue cancelado manualmente o es error de autenticación
            if (lastError.code === 'ABORT' || lastError.isAuthError()) {
                throw lastError;
            }

            // Si hay más intentos, esperar antes de reintentar
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    throw lastError || HttpError.network();
}

/**
 * Asegura que un valor sea un array, devuelve array vacío si no lo es
 */
export function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value : [];
}

/**
 * Mensajes de error amigables para el usuario
 */
export const ERROR_MESSAGES: Record<HttpErrorCode, string> = {
    NETWORK: 'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.',
    TIMEOUT: 'La solicitud tardó demasiado. Intenta de nuevo.',
    ABORT: 'La solicitud fue cancelada.',
    SERVER: 'Error del servidor. Intenta más tarde.',
    PARSE: 'Error al procesar la respuesta.',
    EMPTY_RESPONSE: 'No se recibieron datos del servidor.',
    UNAUTHORIZED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    FORBIDDEN: 'No tienes permisos para realizar esta acción.',
    NOT_FOUND: 'El recurso solicitado no existe.',
    VALIDATION: 'Los datos enviados no son válidos.',
    UNKNOWN: 'Ocurrió un error inesperado.',
};

/**
 * Obtiene un mensaje amigable para el usuario basado en el error
 */
export function getUserFriendlyMessage(error: HttpError): string {
    return error.message || ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN;
}
