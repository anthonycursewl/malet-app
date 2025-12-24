/**
 * HTTP Module - Exports centralizados para manejo de peticiones HTTP
 */

// Error handling
export {
    ERROR_MESSAGES, HttpError, createTimeoutController, ensureArray, fetchWithConfig, getUserFriendlyMessage, parseError,
    parseResponse, safeExecute, type HttpErrorCode, type HttpRequestConfig, type HttpResult
} from './HttpError';

// Secure fetch para peticiones autenticadas de Malet
export {
    secureFetch,
    secureFetchOrThrow,
    secureFetchSafe,
    type SecureFetchOptions,
    type SecureFetchResponse
} from './secureFetch';

