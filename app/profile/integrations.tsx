import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import { ShimmerEffect } from "@/components/malet-ai/ShimmerEffect";
import { SkeletonLoader } from "@/components/malet-ai/SkeletonLoader";
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
    Animated,
    Easing,
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
            icon: 'WK',
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
            icon: 'GO',
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
            icon: 'AP',
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
                'Proximamente',
                `La integracion con ${provider.displayName} estara disponible pronto.`
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

        return info.length > 0 ? info.join(' - ') : null;
    };

    const connectionInfo = getConnectionInfo();

    // Entrance + subtle press feedback
    const anim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [anim]);

    const animatedCardStyle = {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
    } as const;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    };

    const animatedPillStyle = { transform: [{ scale: scaleAnim }] } as const;

    const initials = (provider.displayName || '')
        .split(' ')
        .map(s => s[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <Animated.View
            accessible
            accessibilityLabel={`Integracion ${provider.displayName} - ${connected ? 'conectada' : 'no conectada'}`}
            style={[styles.integrationCard, provider.comingSoon && styles.comingSoonCard, animatedCardStyle]}
        >
            <View style={styles.cardRow}>
                <View style={[styles.providerIcon, { backgroundColor: `${provider.brandColor}12` }]}>
                    <TextMalet style={styles.providerInitials}>{initials}</TextMalet>
                </View>

                <View style={styles.providerInfo}>
                    <View style={styles.providerHeaderRow}>
                        <TextMalet style={styles.providerName} numberOfLines={1}>
                            {provider.displayName}
                        </TextMalet>
                        <View
                            style={[
                                styles.statusBadge,
                                connected
                                    ? styles.statusBadgeConnected
                                    : provider.comingSoon
                                        ? styles.statusBadgeSoon
                                        : styles.statusBadgeAvailable,
                            ]}
                        >
                            <TextMalet
                                style={[
                                    styles.statusBadgeText,
                                    connected
                                        ? styles.statusBadgeTextConnected
                                        : provider.comingSoon
                                            ? styles.statusBadgeTextSoon
                                            : styles.statusBadgeTextAvailable,
                                ]}
                            >
                                {connected ? 'Conectada' : provider.comingSoon ? 'Proximamente' : 'Disponible'}
                            </TextMalet>
                        </View>
                    </View>

                    <TextMalet style={styles.providerDesc} numberOfLines={2}>
                        {provider.description}
                    </TextMalet>
                    {connectionInfo && <TextMalet style={styles.connectionInfo}>{connectionInfo}</TextMalet>}

                    <View style={styles.cardFooterRow}>
                        <View style={styles.cardFooterMeta}>
                            {connected && !provider.comingSoon && (
                                <TextMalet style={styles.connectedAt} numberOfLines={1}>
                                    {connectedAt ? `Conectado - ${new Date(connectedAt).toLocaleDateString()}` : 'Conectado'}
                                </TextMalet>
                            )}
                            {provider.comingSoon && (
                                <TextMalet style={styles.comingSoonHint}>Disponible pronto</TextMalet>
                            )}
                        </View>

                        {!provider.comingSoon && (
                            <Animated.View style={animatedPillStyle}>
                                <TouchableOpacity
                                    style={[
                                        styles.actionPill,
                                        connected ? styles.disconnectPill : styles.connectPill,
                                        !connected ? { borderColor: provider.brandColor } : null,
                                    ]}
                                    onPress={handleAction}
                                    onPressIn={handlePressIn}
                                    onPressOut={handlePressOut}
                                    disabled={isLoading}
                                    activeOpacity={0.86}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${connected ? 'Desconectar' : 'Conectar'} ${provider.displayName}`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={connected ? '#dc3545' : provider.brandColor} />
                                    ) : (
                                        <TextMalet style={[styles.actionPillText, connected ? styles.disconnectPillText : { color: provider.brandColor }]}>
                                            {connected ? 'Desconectar' : 'Conectar'}
                                        </TextMalet>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
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
            setIntegrations(Array.isArray(data) ? data : FALLBACK_INTEGRATIONS);
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
                `Tu cuenta de Malet ha sido conectada con ${integrations?.find?.(i => i?.provider?.id === providerId)?.provider?.displayName ?? providerId}. (Modo demo)`,
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
    const safeIntegrations = Array.isArray(integrations) ? integrations : [];
    const connectedCount = safeIntegrations.filter(i => i?.connected).length;
    const enabledProviders = safeIntegrations.filter(i => i?.provider?.enabled);
    const comingSoonProviders = safeIntegrations.filter(i => i?.provider?.comingSoon);

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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <TextMalet style={styles.backChevron}>{'<'}</TextMalet>
                        <TextMalet style={styles.backText}>Volver</TextMalet>
                    </TouchableOpacity>

                    <TextMalet style={styles.headerTitle}>Integraciones</TextMalet>
                    <TextMalet style={styles.headerSubtitle}>
                        Conecta tu cuenta de Malet con aplicaciones de terceros para potenciar tu experiencia.
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
                    <>
                        <SkeletonLoader />
                        <View style={{ paddingHorizontal: spacing.medium, marginTop: spacing.large }}>
                            {[0, 1, 2].map(i => (
                                <View key={i} style={[styles.integrationCard, { height: 88, justifyContent: 'center', paddingVertical: 12 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <ShimmerEffect style={{ width: 52, height: 52, borderRadius: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <ShimmerEffect style={{ width: '40%', height: 16, borderRadius: 8, marginBottom: 8 }} />
                                            <ShimmerEffect style={{ width: '60%', height: 12, borderRadius: 6 }} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
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
        paddingHorizontal: spacing.small,
    },
    header: {
        marginTop: spacing.small,
        marginBottom: spacing.large,
        padding: spacing.small + 2,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    backButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.small + 2,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#eef2f7',
    },
    backChevron: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '700',
    },
    backText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '700',
        color: '#0f1724',
        marginBottom: 10,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        maxWidth: '96%',
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        borderRadius: 16,
        padding: spacing.small + 2,
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
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: spacing.small - 2,
        paddingHorizontal: spacing.small,
        marginBottom: spacing.small + 6,
        borderWidth: 1,
        borderColor: '#dbe4ef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0,
        shadowRadius: 16,
        elevation: 0,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    providerIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerInitials: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    providerInfo: {
        flex: 1,
        minHeight: 56,
        justifyContent: 'center',
    },
    providerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f1724',
        flexShrink: 1,
    },
    statusBadge: {
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusBadgeAvailable: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    statusBadgeConnected: {
        backgroundColor: '#ecfdf3',
        borderColor: '#bbf7d0',
    },
    statusBadgeSoon: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    statusBadgeTextAvailable: {
        color: '#1d4ed8',
    },
    statusBadgeTextConnected: {
        color: '#15803d',
    },
    statusBadgeTextSoon: {
        color: '#64748b',
    },
    providerDesc: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 5,
    },
    cardFooterRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    cardFooterMeta: {
        flex: 1,
        minHeight: 18,
        justifyContent: 'center',
    },
    actionPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1.2,
        backgroundColor: '#ffffff',
        minWidth: 98,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectPill: {
        backgroundColor: '#f8fbff',
    },
    actionPillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    disconnectPill: {
        borderColor: '#fecaca',
        backgroundColor: '#fff7f7',
    },
    disconnectPillText: {
        color: '#b91c1c',
    },
    connectedAt: {
        fontSize: 11,
        color: '#94a3b8',
    },
    comingSoonHint: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
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

