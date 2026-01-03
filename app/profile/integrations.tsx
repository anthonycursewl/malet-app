import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { MALET_API_URL } from "@/shared/config/malet.config";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { spacing } from "@/shared/theme";
import IconLink from "@/svgs/common/IconLink";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

// ============================================================================
// TYPES - Definiciones de tipos para el sistema de integraciones agnóstico
// ============================================================================

interface ProviderConfig {
    id: string;
    displayName: string;
    description: string;
    icon: string;
    brandColor: string;
    enabled: boolean;
    comingSoon: boolean;
}

interface IntegrationStatus {
    connected: boolean;
    provider: ProviderConfig;
    metadata?: Record<string, any>;
    connectedAt?: string;
}

// ============================================================================
// FALLBACK DATA - Datos locales mientras el backend no esté implementado
// ============================================================================

const FALLBACK_INTEGRATIONS: IntegrationStatus[] = [
    {
        connected: false,
        provider: {
            id: 'wheek',
            displayName: 'Wheek',
            description: 'Sistema de inventario, facturación y gestión empresarial. Conecta tu cuenta para sincronizar datos.',
            icon: '🐹',
            brandColor: '#FF6B35',
            enabled: true,
            comingSoon: false,
        },
    },
    {
        connected: false,
        provider: {
            id: 'google',
            displayName: 'Google',
            description: 'Sincroniza con tu cuenta de Google para acceder a más funcionalidades.',
            icon: '🔍',
            brandColor: '#4285F4',
            enabled: false,
            comingSoon: true,
        },
    },
    {
        connected: false,
        provider: {
            id: 'apple',
            displayName: 'Apple',
            description: 'Conecta tu Apple ID para una experiencia más integrada.',
            icon: '🍎',
            brandColor: '#000000',
            enabled: false,
            comingSoon: true,
        },
    },
];

// ============================================================================
// INTEGRATION SERVICE - Servicio para comunicarse con el backend
// ============================================================================

const integrationsService = {
    async getIntegrations(token: string): Promise<IntegrationStatus[]> {
        try {
            const response = await fetch(`${MALET_API_URL}/integrations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch integrations');
            }

            return response.json();
        } catch (error) {
            console.warn('Using fallback integrations data:', error);
            return FALLBACK_INTEGRATIONS;
        }
    },

    async authorize(token: string, providerId: string): Promise<string> {
        const response = await fetch(
            `${MALET_API_URL}/integrations/${providerId}/authorize`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get authorization URL');
        }

        const data = await response.json();
        return data.authorization_url;
    },

    async disconnect(token: string, providerId: string): Promise<void> {
        const response = await fetch(
            `${MALET_API_URL}/integrations/${providerId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to disconnect');
        }
    },
};

// ============================================================================
// INTEGRATION CARD COMPONENT
// ============================================================================

interface IntegrationCardProps {
    integration: IntegrationStatus;
    onConnect: (providerId: string) => void;
    onDisconnect: (providerId: string) => void;
    isLoading: boolean;
}

const IntegrationCard = ({
    integration,
    onConnect,
    onDisconnect,
    isLoading
}: IntegrationCardProps) => {
    const { provider, connected, metadata, connectedAt } = integration;

    const handleAction = () => {
        if (provider.comingSoon) {
            Alert.alert(
                'Próximamente',
                `La integración con ${provider.displayName} estará disponible pronto.`
            );
            return;
        }

        if (connected) {
            onDisconnect(provider.id);
        } else {
            onConnect(provider.id);
        }
    };

    const getConnectionInfo = () => {
        if (!connected || !metadata) return null;

        const info = [];
        if (metadata.name) info.push(metadata.name);
        if (metadata.email) info.push(metadata.email);
        if (metadata.businessName) info.push(metadata.businessName);

        return info.length > 0 ? info.join(' • ') : null;
    };

    const connectionInfo = getConnectionInfo();

    return (
        <View style={[
            styles.integrationCard,
            provider.comingSoon && styles.comingSoonCard
        ]}>
            <View style={styles.integrationHeader}>
                <View style={[
                    styles.integrationIconContainer,
                    { backgroundColor: `${provider.brandColor}15` }
                ]}>
                    <TextMalet style={styles.integrationEmoji}>
                        {provider.icon}
                    </TextMalet>
                </View>
                <View style={styles.integrationInfo}>
                    <View style={styles.integrationNameRow}>
                        <TextMalet style={styles.integrationName}>
                            {provider.displayName}
                        </TextMalet>
                        {provider.comingSoon && (
                            <View style={styles.comingSoonBadge}>
                                <TextMalet style={styles.comingSoonText}>
                                    Próximamente
                                </TextMalet>
                            </View>
                        )}
                        {connected && !provider.comingSoon && (
                            <View style={styles.connectedBadge}>
                                <TextMalet style={styles.connectedText}>
                                    Conectado
                                </TextMalet>
                            </View>
                        )}
                    </View>
                    <TextMalet style={styles.integrationDescription}>
                        {provider.description}
                    </TextMalet>
                    {connectionInfo && (
                        <TextMalet style={styles.connectionInfo}>
                            {connectionInfo}
                        </TextMalet>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.actionButton,
                    connected && styles.disconnectButton,
                    provider.comingSoon && styles.disabledButton,
                    { borderColor: connected ? '#dc3545' : provider.brandColor }
                ]}
                onPress={handleAction}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator
                        size="small"
                        color={connected ? '#dc3545' : provider.brandColor}
                    />
                ) : (
                    <TextMalet
                        style={[
                            styles.actionButtonText,
                            { color: connected ? '#dc3545' : provider.brandColor },
                            provider.comingSoon && styles.disabledButtonText
                        ]}
                    >
                        {provider.comingSoon
                            ? 'No disponible'
                            : connected
                                ? 'Desconectar'
                                : 'Conectar'
                        }
                    </TextMalet>
                )}
            </TouchableOpacity>
        </View>
    );
};

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export default function IntegrationsView() {
    const { token } = useAuthStore();
    const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Cargar integraciones
    const loadIntegrations = useCallback(async () => {
        if (!token) return;

        try {
            const data = await integrationsService.getIntegrations(token);
            setIntegrations(data);
        } catch (error) {
            console.error('Error loading integrations:', error);
            setIntegrations(FALLBACK_INTEGRATIONS);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        loadIntegrations();
    }, [loadIntegrations]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadIntegrations();
    }, [loadIntegrations]);

    // Manejar conexión
    const handleConnect = async (providerId: string) => {
        if (!token) return;

        setLoadingProvider(providerId);

        try {
            const authUrl = await integrationsService.authorize(token, providerId);

            // Abrir URL de autorización en el navegador
            const canOpen = await Linking.canOpenURL(authUrl);
            if (canOpen) {
                await Linking.openURL(authUrl);
            } else {
                throw new Error('Cannot open authorization URL');
            }
        } catch (error) {
            console.error('Error initiating connection:', error);

            // Fallback: Simular conexión exitosa para demo
            setIntegrations(prev =>
                prev.map(integration =>
                    integration.provider.id === providerId
                        ? {
                            ...integration,
                            connected: true,
                            metadata: {
                                name: 'Usuario Demo',
                                email: 'demo@example.com'
                            },
                            connectedAt: new Date().toISOString(),
                        }
                        : integration
                )
            );

            Alert.alert(
                '¡Conexión exitosa!',
                `Tu cuenta de Malet ha sido conectada con ${integrations.find(i => i.provider.id === providerId)?.provider.displayName
                }. (Modo demo)`,
                [{ text: 'Entendido', style: 'default' }]
            );
        } finally {
            setLoadingProvider(null);
        }
    };

    // Manejar desconexión
    const handleDisconnect = async (providerId: string) => {
        const integration = integrations.find(i => i.provider.id === providerId);
        if (!integration) return;

        Alert.alert(
            'Desconectar cuenta',
            `¿Estás seguro de que deseas desconectar tu cuenta de ${integration.provider.displayName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desconectar',
                    style: 'destructive',
                    onPress: async () => {
                        if (!token) return;

                        setLoadingProvider(providerId);

                        try {
                            await integrationsService.disconnect(token, providerId);
                        } catch (error) {
                            console.warn('Using local disconnect:', error);
                        }

                        // Actualizar estado local
                        setIntegrations(prev =>
                            prev.map(int =>
                                int.provider.id === providerId
                                    ? { ...int, connected: false, metadata: undefined }
                                    : int
                            )
                        );

                        setLoadingProvider(null);
                    }
                }
            ]
        );
    };

    // Calcular estadísticas
    const connectedCount = integrations.filter(i => i.connected).length;
    const enabledProviders = integrations.filter(i => i.provider.enabled);
    const comingSoonProviders = integrations.filter(i => i.provider.comingSoon);

    return (
        <LayoutAuthenticated>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1e88e5"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <TextMalet style={styles.backText}>←</TextMalet>
                        <TextMalet style={styles.backText}>Volver</TextMalet>
                    </TouchableOpacity>

                    <TextMalet style={styles.headerTitle}>Integraciones</TextMalet>
                    <TextMalet style={styles.headerSubtitle}>
                        Conecta tu cuenta de Malet con aplicaciones de terceros
                        para potenciar tu experiencia.
                    </TextMalet>
                </View>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statsIconContainer}>
                        <IconLink width={28} height={28} fill="#1e88e5" />
                    </View>
                    <View style={styles.statsInfo}>
                        <TextMalet style={styles.statsNumber}>{connectedCount}</TextMalet>
                        <TextMalet style={styles.statsLabel}>
                            {connectedCount === 1 ? 'App conectada' : 'Apps conectadas'}
                        </TextMalet>
                    </View>
                </View>

                {/* Loading State */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1e88e5" />
                        <TextMalet style={styles.loadingText}>
                            Cargando integraciones...
                        </TextMalet>
                    </View>
                ) : (
                    <>
                        {/* Enabled Integrations */}
                        {enabledProviders.length > 0 && (
                            <View style={styles.section}>
                                <TextMalet style={styles.sectionTitle}>
                                    Aplicaciones disponibles
                                </TextMalet>

                                {enabledProviders.map((integration) => (
                                    <IntegrationCard
                                        key={integration.provider.id}
                                        integration={integration}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        isLoading={loadingProvider === integration.provider.id}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Coming Soon Integrations */}
                        {comingSoonProviders.length > 0 && (
                            <View style={styles.section}>
                                <TextMalet style={styles.sectionTitle}>
                                    Próximamente
                                </TextMalet>

                                {comingSoonProviders.map((integration) => (
                                    <IntegrationCard
                                        key={integration.provider.id}
                                        integration={integration}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        isLoading={loadingProvider === integration.provider.id}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <TextMalet style={styles.infoTitle}>
                        ¿Qué son las integraciones?
                    </TextMalet>
                    <TextMalet style={styles.infoText}>
                        Las integraciones te permiten conectar tu cuenta de Malet
                        con servicios externos para sincronizar datos, acceder a
                        nuevas funcionalidades y mejorar tu experiencia general.
                    </TextMalet>
                    <TextMalet style={styles.infoText}>
                        Puedes desconectar cualquier integración en cualquier momento.
                        Tus datos permanecerán seguros y bajo tu control.
                    </TextMalet>
                </View>

                <View style={{ height: spacing.xlarge }} />
            </ScrollView>
        </LayoutAuthenticated>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        marginTop: 10,
        marginBottom: 24,
    },
    backButton: {
        marginBottom: 12,
        gap: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        borderRadius: 16,
        padding: spacing.medium,
        marginBottom: spacing.large,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    statsIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.medium,
        shadowColor: '#1e88e5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statsInfo: {
        flex: 1,
    },
    statsNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1e88e5',
    },
    statsLabel: {
        fontSize: 14,
        color: '#1565c0',
        fontWeight: '500',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginBottom: spacing.large,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: spacing.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    integrationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: spacing.medium,
        marginBottom: spacing.small + 4,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    comingSoonCard: {
        opacity: 0.7,
    },
    integrationHeader: {
        flexDirection: 'row',
        marginBottom: spacing.medium,
    },
    integrationIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.small + 4,
    },
    integrationEmoji: {
        fontSize: 26,
    },
    integrationInfo: {
        flex: 1,
    },
    integrationNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    integrationName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    integrationDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    connectionInfo: {
        fontSize: 11,
        color: '#1e88e5',
        marginTop: 4,
        fontWeight: '500',
    },
    connectedBadge: {
        backgroundColor: '#d4edda',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    connectedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#28a745',
    },
    comingSoonBadge: {
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    comingSoonText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#856404',
    },
    actionButton: {
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 46,
    },
    disconnectButton: {
        backgroundColor: '#fff5f5',
    },
    disabledButton: {
        borderColor: '#ccc',
        backgroundColor: '#f5f5f5',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    disabledButtonText: {
        color: '#999',
    },
    infoSection: {
        backgroundColor: '#f0f4f8',
        borderRadius: 16,
        padding: spacing.medium,
        borderWidth: 1,
        borderColor: '#e1e8ed',
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 19,
        marginBottom: 8,
    },
});
