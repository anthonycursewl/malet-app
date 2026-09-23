import { MALET_API_URL } from '@/shared/config/malet.config';
import { secureFetchOrThrow } from '@/shared/http/secureFetch';

// Tipos del sistema de integraciones agnóstico (ver docs/INTEGRATIONS_SYSTEM.md)
export interface ProviderConfig {
    id: string;
    displayName: string;
    description: string;
    icon: string;
    brandColor: string;
    enabled: boolean;
    comingSoon: boolean;
}

export interface IntegrationStatus {
    connected: boolean;
    provider: ProviderConfig;
    metadata?: Record<string, any>;
    connectedAt?: string;
}

/**
 * Cliente del sistema de integraciones.
 * Contrato del backend (docs/INTEGRATIONS_SYSTEM.md):
 * - GET  /integrations                  -> lista de integraciones con estado
 * - GET  /integrations/:provider/authorize -> { authorization_url }
 * - GET  /integrations/:provider/callback  -> redirige a maletapp://integrations?success=true|error=...
 * - DELETE /integrations/:provider      -> desconecta
 */
export const integrationsService = {
    async getIntegrations(): Promise<IntegrationStatus[]> {
        return secureFetchOrThrow<IntegrationStatus[]>({
            url: `${MALET_API_URL}/integrations`,
            method: 'GET',
        });
    },

    async authorize(providerId: string): Promise<string> {
        const data = await secureFetchOrThrow<{ authorization_url: string }>({
            url: `${MALET_API_URL}/integrations/${providerId}/authorize`,
            method: 'GET',
        });
        return data.authorization_url;
    },

    async disconnect(providerId: string): Promise<void> {
        await secureFetchOrThrow<void>({
            url: `${MALET_API_URL}/integrations/${providerId}`,
            method: 'DELETE',
        });
    },
};
