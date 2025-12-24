import { MALET_API_URL } from '../../config/malet.config';
import { secureFetch } from '../../http/secureFetch';
import {
    AIChatRequest,
    AIChatResponse,
    AIErrorData,
    AIServiceError,
    HealthResponse,
    MessageRole,
    ModelsResponse
} from './ai.types';

/**
 * Maneja errores de respuesta HTTP con soporte para rate limit
 */
function handleResponseError(
    statusCode: number,
    errorData?: AIErrorData | string
): never {
    const errorMessage = typeof errorData === 'string' ? errorData : errorData?.message;
    const retryAfterSeconds = typeof errorData === 'object' ? errorData?.retryAfterSeconds : undefined;

    switch (statusCode) {
        case 401:
        case 403:
            throw new AIServiceError(
                errorMessage || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                'UNAUTHORIZED',
                statusCode
            );
        case 429:
            throw new AIServiceError(
                errorMessage || 'Has alcanzado el límite de mensajes. Espera un momento e intenta de nuevo.',
                'AI_RATE_LIMIT',
                429,
                retryAfterSeconds || 60  // Default 60 segundos si no viene
            );
        case 422:
            throw new AIServiceError(
                errorMessage || 'Contenido bloqueado por filtros de seguridad.',
                'AI_CONTENT_FILTERED',
                422
            );
        case 400:
            throw new AIServiceError(
                errorMessage || 'Solicitud inválida',
                'AI_BAD_REQUEST',
                400
            );
        case 503:
            throw new AIServiceError(
                errorMessage || 'El servicio está sobrecargado. Intenta en unos segundos.',
                'AI_OVERLOADED',
                503
            );
        default:
            throw new AIServiceError(
                errorMessage || 'El servicio de IA no está disponible. Intenta más tarde.',
                'AI_UNAVAILABLE',
                statusCode
            );
    }
}

/**
 * Verifica si el servicio de AI está disponible
 */
export async function checkAIHealth(): Promise<HealthResponse> {
    try {
        const { response, error } = await secureFetch<HealthResponse>({
            url: `${MALET_API_URL}/ai/health`,
            method: 'GET',
        });

        if (error || !response) {
            return {
                status: 'error',
                service: 'ai-chat',
                timestamp: new Date().toISOString()
            };
        }

        return response;
    } catch {
        return {
            status: 'error',
            service: 'ai-chat',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Obtiene los modelos disponibles
 */
export async function getAvailableModels(): Promise<ModelsResponse> {
    const { response, error, httpError } = await secureFetch<ModelsResponse>({
        url: `${MALET_API_URL}/ai/models`,
        method: 'GET',
    });

    if (error || !response) {
        handleResponseError(httpError?.status || 500, error || undefined);
    }

    return response;
}

/**
 * Envía un mensaje al AI y recibe la respuesta
 */
export async function sendChatMessage(
    messages: Array<{ role: MessageRole; content: string }>,
    options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
    }
): Promise<AIChatResponse> {
    const body: AIChatRequest = {
        messages,
        ...options,
    };

    try {
        const { response, error, httpError } = await secureFetch<AIChatResponse>({
            url: `${MALET_API_URL}/ai/chat`,
            method: 'POST',
            body,
            config: {
                timeout: 60000,
            },
        });

        if (error || !response) {
            if (httpError) {
                // Extraer retryAfterSeconds de los detalles si está disponible
                let retryAfterSeconds: number | undefined;

                if (httpError.details && typeof httpError.details === 'object') {
                    const details = httpError.details as AIErrorData;
                    retryAfterSeconds = details.retryAfterSeconds;
                }

                // Construir errorData con información disponible
                const errorData: AIErrorData = {
                    statusCode: httpError.status,
                    error: httpError.code || 'Error',
                    message: error || httpError.message,
                    code: httpError.status === 429 ? 'AI_RATE_LIMIT' : 'AI_UNAVAILABLE',
                    retryAfterSeconds,
                };

                handleResponseError(httpError.status || 500, errorData);
            }

            throw new AIServiceError(
                error || 'Error al comunicarse con el servicio de IA',
                'SERVICE_ERROR'
            );
        }

        return response;
    } catch (err) {
        if (err instanceof AIServiceError) {
            throw err;
        }

        throw new AIServiceError(
            'No hay conexión a internet. Verifica tu conexión e intenta de nuevo.',
            'NETWORK_ERROR'
        );
    }
}
