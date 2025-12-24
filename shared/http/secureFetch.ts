import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ensureArray,
    fetchWithConfig,
    getUserFriendlyMessage,
    HttpError,
    HttpRequestConfig,
    HttpResult,
    parseError,
    parseResponse
} from './HttpError';

export interface SecureFetchOptions<T = unknown> {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: unknown;
    setLoading?: (loading: boolean) => void;
    config?: HttpRequestConfig;
    expectArray?: boolean;
}

export interface SecureFetchResponse<T> {
    error: string | null;
    response: T | null;
    httpError: HttpError | null;
}

/**
 * Helper para todas las peticiones HTTP autenticadas de Malet
 * Con manejo robusto de errores, timeout y reintentos
 */
export const secureFetch = async <T = unknown>(
    options: SecureFetchOptions<T>
): Promise<SecureFetchResponse<T>> => {
    const {
        url,
        method,
        headers,
        body,
        setLoading,
        config,
        expectArray = false,
    } = options;

    try {
        if (setLoading) {
            setLoading(true);
        }

        const token = await AsyncStorage.getItem('token');

        const defaultHeaders: Record<string, string> = {
            'Authorization': `Bearer ${token || ''}`,
        };

        if (!(body instanceof FormData)) {
            defaultHeaders['Content-Type'] = 'application/json';
        }

        // Preparar el body
        let requestBody: BodyInit | undefined;
        if (body instanceof FormData) {
            requestBody = body;
        } else if (body !== undefined) {
            requestBody = JSON.stringify(body);
        }

        // Hacer la petición con timeout y config
        const response = await fetchWithConfig(
            url,
            {
                method,
                headers: {
                    ...defaultHeaders,
                    ...headers,
                },
                body: requestBody,
            },
            config
        );

        // Parsear la respuesta
        const data = await parseResponse<T>(response);

        // Si esperamos un array, asegurarnos de que sea válido
        if (expectArray) {
            const safeData = ensureArray(data) as T;
            return { response: safeData, error: null, httpError: null };
        }

        return { response: data, error: null, httpError: null };
    } catch (error) {
        const httpError = parseError(error);
        const userMessage = getUserFriendlyMessage(httpError);

        return {
            error: userMessage,
            response: null,
            httpError,
        };
    } finally {
        if (setLoading) {
            setLoading(false);
        }
    }
};

/**
 * Versión tipada que lanza excepciones en lugar de devolver error
 * Útil para usar con try/catch o React Query
 */
export const secureFetchOrThrow = async <T = unknown>(
    options: Omit<SecureFetchOptions<T>, 'setLoading'>
): Promise<T> => {
    const { url, method, headers, body, config, expectArray = false } = options;

    const token = await AsyncStorage.getItem('token');

    const defaultHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token || ''}`,
    };

    if (!(body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    let requestBody: BodyInit | undefined;
    if (body instanceof FormData) {
        requestBody = body;
    } else if (body !== undefined) {
        requestBody = JSON.stringify(body);
    }

    const response = await fetchWithConfig(
        url,
        {
            method,
            headers: {
                ...defaultHeaders,
                ...headers,
            },
            body: requestBody,
        },
        config
    );

    const data = await parseResponse<T>(response);

    if (expectArray) {
        return ensureArray(data) as T;
    }

    return data;
};

/**
 * Versión que devuelve HttpResult para manejo sin excepciones
 */
export const secureFetchSafe = async <T = unknown>(
    options: Omit<SecureFetchOptions<T>, 'setLoading'>
): Promise<HttpResult<T>> => {
    try {
        const data = await secureFetchOrThrow<T>(options);
        return { success: true, data, error: null };
    } catch (error) {
        return { success: false, data: null, error: parseError(error) };
    }
};

// Re-exportar utilidades de HttpError para conveniencia
export {
    ensureArray, getUserFriendlyMessage, HttpError,
    parseError, type HttpErrorCode, type HttpResult
} from './HttpError';

