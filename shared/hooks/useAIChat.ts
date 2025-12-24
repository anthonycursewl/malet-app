import { useCallback, useEffect, useRef, useState } from 'react';
import {
    checkAIHealth,
    sendChatMessage
} from '../services/ai';
import {
    AIChatConfig,
    AIChatState,
    AIServiceError,
    ChatMessage,
    MessageRole
} from '../services/ai/ai.types';

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_CONFIG: AIChatConfig = {
    systemPrompt: `Eres un asistente financiero de la app Malet. 
Ayudas a los usuarios a gestionar sus finanzas personales de forma amigable y profesional.
Responde siempre en español de manera concisa y útil.
Si no sabes algo, sé honesto y sugiere alternativas.
Puedes dar consejos sobre ahorro, presupuestos, inversiones y gastos.
IMPORTANTE: Siempre completa tus respuestas. Si una respuesta es larga, prioriza la información más relevante.`,
    model: 'gemini-2.5-flash',
    maxTokens: 4096,
    temperature: 0.7,
};

const MAX_HISTORY_MESSAGES = 10;

interface UseAIChatOptions {
    config?: Partial<AIChatConfig>;
    onError?: (error: AIServiceError) => void;
    onAuthError?: () => void;
    initialMessages?: ChatMessage[];
}

export function useAIChat(options: UseAIChatOptions = {}) {
    const config = { ...DEFAULT_CONFIG, ...options.config };

    const [state, setState] = useState<AIChatState>({
        messages: options.initialMessages || [],
        isLoading: false,
        error: null,
        isServiceAvailable: true,
        rateLimitCountdown: null,
    });

    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Limpiar countdown al desmontar
    useEffect(() => {
        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const checkService = async () => {
            const health = await checkAIHealth();
            setState(prev => ({
                ...prev,
                isServiceAvailable: health.status === 'ok',
            }));
        };

        checkService();
    }, []);

    /**
     * Inicia countdown de rate limit
     */
    const startRateLimitCountdown = useCallback((seconds: number) => {
        // Limpiar countdown anterior
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

        setState(prev => ({ ...prev, rateLimitCountdown: seconds }));

        countdownRef.current = setInterval(() => {
            setState(prev => {
                if (prev.rateLimitCountdown === null || prev.rateLimitCountdown <= 1) {
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                        countdownRef.current = null;
                    }
                    return { ...prev, rateLimitCountdown: null, error: null };
                }
                return { ...prev, rateLimitCountdown: prev.rateLimitCountdown - 1 };
            });
        }, 1000);
    }, []);

    const sendMessage = useCallback(async (userMessage: string): Promise<string | null> => {
        // Bloquear si hay countdown activo
        if (state.rateLimitCountdown !== null) {
            return null;
        }

        if (!userMessage.trim() || state.isLoading) return null;

        const userChatMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: userMessage.trim(),
            timestamp: new Date(),
            status: 'sending',
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userChatMessage],
            isLoading: true,
            error: null,
        }));

        try {
            const apiMessages: Array<{ role: MessageRole; content: string }> = [];

            if (config.systemPrompt) {
                apiMessages.push({
                    role: 'system',
                    content: config.systemPrompt,
                });
            }

            const historyMessages = state.messages
                .filter(m => m.role !== 'system')
                .slice(-MAX_HISTORY_MESSAGES)
                .map(m => ({ role: m.role, content: m.content }));

            apiMessages.push(...historyMessages);

            apiMessages.push({
                role: 'user',
                content: userMessage.trim(),
            });

            const response = await sendChatMessage(apiMessages, {
                model: config.model,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
            });

            let content = response.content;
            const wasTruncated = response.finishReason === 'length' ||
                response.finishReason === 'MAX_TOKENS' ||
                response.truncated;

            if (wasTruncated) {
                content += '\n\n*[Respuesta truncada por límite de longitud]*';
            }

            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: content,
                timestamp: new Date(response.createdAt),
                status: 'sent',
            };

            setState(prev => ({
                ...prev,
                messages: prev.messages.map(m =>
                    m.id === userChatMessage.id
                        ? { ...m, status: 'sent' as const }
                        : m
                ).concat(assistantMessage),
                isLoading: false,
            }));

            return assistantMessage.id;

        } catch (error) {
            const aiError = error instanceof AIServiceError
                ? error
                : new AIServiceError('Error inesperado', 'SERVICE_ERROR');

            // Manejar Rate Limit con countdown
            if (aiError.isRateLimited() && aiError.retryAfterSeconds) {
                startRateLimitCountdown(aiError.retryAfterSeconds);
            }

            // Manejar Auth Error
            if (aiError.isAuthError()) {
                options.onAuthError?.();
            }

            setState(prev => ({
                ...prev,
                messages: prev.messages.map(m =>
                    m.id === userChatMessage.id
                        ? { ...m, status: 'error' as const }
                        : m
                ),
                isLoading: false,
                error: aiError,
            }));

            options.onError?.(aiError);

            return null;
        }
    }, [state.messages, state.isLoading, state.rateLimitCountdown, config, options, startRateLimitCountdown]);

    const retryMessage = useCallback(async (messageId: string) => {
        const message = state.messages.find(m => m.id === messageId);
        if (!message || message.role !== 'user') return;

        setState(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m.id !== messageId),
        }));

        await sendMessage(message.content);
    }, [state.messages, sendMessage]);

    const clearMessages = useCallback(() => {
        setState(prev => ({
            ...prev,
            messages: [],
            error: null,
        }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
        }));
    }, []);

    const getLastAssistantMessage = useCallback(() => {
        const assistantMessages = state.messages.filter(m => m.role === 'assistant');
        return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
    }, [state.messages]);

    return {
        // Estado
        messages: state.messages,
        isLoading: state.isLoading,
        error: state.error,
        isServiceAvailable: state.isServiceAvailable,
        rateLimitCountdown: state.rateLimitCountdown,

        // Estados derivados
        isRateLimited: state.rateLimitCountdown !== null,
        canSendMessage: !state.isLoading && state.rateLimitCountdown === null,

        // Acciones
        sendMessage,
        retryMessage,
        clearMessages,
        clearError,
        getLastAssistantMessage,
    };
}
