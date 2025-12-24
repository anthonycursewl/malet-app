/**
 * Tipos para el módulo de AI Chat
 */

// Roles de mensaje soportados por el API
export type MessageRole = 'user' | 'assistant' | 'system';

// Mensaje individual en la conversación
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
}

// Request al API
export interface AIChatRequest {
    messages: Array<{
        role: MessageRole;
        content: string;
    }>;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

// Response del API
export interface AIChatResponse {
    id: string;
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: string;
    truncated?: boolean;
    createdAt: string;
}

// Response de modelos disponibles
export interface ModelsResponse {
    models: string[];
    default: string;
}

// Response de health check
export interface HealthResponse {
    status: 'ok' | 'error';
    service: string;
    timestamp: string;
}

// Códigos de error específicos del AI
export type AIErrorCode =
    | 'AI_RATE_LIMIT'
    | 'AI_BAD_REQUEST'
    | 'AI_AUTH_FAILED'
    | 'AI_OVERLOADED'
    | 'AI_UNAVAILABLE'
    | 'AI_CONTENT_FILTERED'
    | 'UNAUTHORIZED'
    | 'RATE_LIMITED'  // Alias para compatibilidad
    | 'SERVICE_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

// Error de Rate Limit con información de retry
export interface RateLimitErrorData {
    statusCode: 429;
    error: string;
    message: string;
    code: 'AI_RATE_LIMIT';
    retryAfterSeconds: number;
    retryAfterMs: number;
}

// Error genérico del AI
export interface AIErrorData {
    statusCode: number;
    error: string;
    message: string;
    code: AIErrorCode;
    retryAfterSeconds?: number;
}

// Clase de error actualizada
export class AIServiceError extends Error {
    public retryAfterSeconds?: number;

    constructor(
        message: string,
        public code: AIErrorCode,
        public statusCode?: number,
        retryAfterSeconds?: number
    ) {
        super(message);
        this.name = 'AIServiceError';
        this.retryAfterSeconds = retryAfterSeconds;
    }

    isRateLimited(): boolean {
        return this.code === 'AI_RATE_LIMIT' || this.code === 'RATE_LIMITED';
    }

    isAuthError(): boolean {
        return this.code === 'UNAUTHORIZED' || this.code === 'AI_AUTH_FAILED';
    }
}

// Configuración del chat
export interface AIChatConfig {
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

// Estado del hook (actualizado con rate limit)
export interface AIChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: AIServiceError | null;
    isServiceAvailable: boolean;
    rateLimitCountdown: number | null;
}
