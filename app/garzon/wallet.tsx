import Button from '@/components/Button/Button';
import GarzonHeader from '@/components/garzon/GarzonHeader';
import ModalOptions from '@/components/shared/ModalOptions';
import TextMalet from '@/components/TextMalet/TextMalet';
import { MALET_API_URL } from '@/shared/config/malet.config';
import { secureFetch } from '@/shared/http/secureFetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY_WALLET_ID = 'garzon_wallet_id';

// Banderas por código de moneda
const CURRENCY_FLAGS: Record<string, string> = {
    COP: 'https://flagcdn.com/w40/co.png',
    USD: 'https://flagcdn.com/w40/us.png',
    BS: 'https://flagcdn.com/w40/ve.png',
    PTG: 'https://flagcdn.com/w40/ve.png',
};

// Colores por código de moneda
const CURRENCY_COLORS: Record<string, { bg: string; text: string }> = {
    COP: { bg: '#FEF3C7', text: '#D97706' },
    USD: { bg: '#D1FAE5', text: '#059669' },
    BS: { bg: '#E0E7FF', text: '#4338CA' },
    PTG: { bg: '#FCE7F3', text: '#BE185D' },
};

interface WalletItem {
    available: number;
    balance: number;
    currency: string;
    currencyCode: string;
    hasToken: boolean;
    lastUpdate: string;
    moneda: number;
    pending: number;
    status: string;
    walletId: number;
}

type TabType = 'wallets' | 'tokens';

interface ClientInfo {
    email: string;
    id: number;
    idNumber: string;
    mobile: string;
    name: string;
}

interface WalletSummary {
    activeWallets: number;
    currencies: string[];
    totalWallets: number;
}

interface WalletResponse {
    client: ClientInfo;
    summary: WalletSummary;
    wallets: WalletItem[];
}

// Skeleton animado
const SkeletonBox = memo(({ width, height, style }: { width: number | string; height: number; style?: any }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 6,
                    opacity,
                },
                style,
            ]}
        />
    );
});

// Skeleton de la tarjeta de cliente
const ClientCardSkeleton = memo(() => (
    <View style={styles.clientCard}>
        <View style={styles.clientHeader}>
            <SkeletonBox width={44} height={44} style={{ borderRadius: 22 }} />
            <View style={[styles.clientInfo, { marginLeft: 12 }]}>
                <SkeletonBox width={140} height={16} style={{ marginBottom: 6 }} />
                <SkeletonBox width={100} height={12} />
            </View>
            <SkeletonBox width={50} height={24} style={{ borderRadius: 6 }} />
        </View>
        <View style={styles.clientContactRow}>
            <SkeletonBox width={40} height={12} />
            <SkeletonBox width={150} height={12} />
        </View>
        <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
                <SkeletonBox width={30} height={24} style={{ marginBottom: 4 }} />
                <SkeletonBox width={50} height={10} />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
                <SkeletonBox width={30} height={24} style={{ marginBottom: 4 }} />
                <SkeletonBox width={50} height={10} />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
                <SkeletonBox width={30} height={24} style={{ marginBottom: 4 }} />
                <SkeletonBox width={50} height={10} />
            </View>
        </View>
    </View>
));

// Skeleton de wallet card
const WalletCardSkeleton = memo(() => (
    <View style={styles.walletCard}>
        <View style={styles.walletCardHeader}>
            <View style={styles.walletCurrencyRow}>
                <SkeletonBox width={28} height={20} style={{ borderRadius: 3 }} />
                <View style={{ marginLeft: 10 }}>
                    <SkeletonBox width={80} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={30} height={10} />
                </View>
            </View>
            <SkeletonBox width={50} height={20} style={{ borderRadius: 4 }} />
        </View>
        <View style={styles.walletBalanceSection}>
            <View style={styles.walletBalanceMain}>
                <SkeletonBox width={40} height={10} style={{ marginBottom: 6 }} />
                <SkeletonBox width={80} height={24} />
            </View>
            <View style={styles.walletBalanceDivider} />
            <View style={styles.walletBalanceSecondary}>
                <View style={styles.walletBalanceRow}>
                    <SkeletonBox width={60} height={10} />
                    <SkeletonBox width={50} height={10} />
                </View>
                <View style={[styles.walletBalanceRow, { marginTop: 6 }]}>
                    <SkeletonBox width={60} height={10} />
                    <SkeletonBox width={50} height={10} />
                </View>
            </View>
        </View>
        <View style={styles.walletFooter}>
            <SkeletonBox width={120} height={10} />
            <SkeletonBox width={60} height={10} />
        </View>
    </View>
));

// Componente de carga completo
const LoadingSkeleton = memo(() => (
    <View style={styles.listContent}>
        <ClientCardSkeleton />
        <View style={styles.walletsHeader}>
            <SkeletonBox width={100} height={16} style={{ marginBottom: 4 }} />
            <SkeletonBox width={140} height={12} />
        </View>
        <WalletCardSkeleton />
        <WalletCardSkeleton />
        <WalletCardSkeleton />
    </View>
));

const WalletCard = memo(({ wallet }: { wallet: WalletItem }) => {
    const colors = CURRENCY_COLORS[wallet.currencyCode] || { bg: '#F3F4F6', text: '#6B7280' };
    const flagUrl = CURRENCY_FLAGS[wallet.currencyCode];

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-VE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <View style={styles.walletCard}>
            <View style={styles.walletCardHeader}>
                <View style={styles.walletCurrencyRow}>
                    {flagUrl && (
                        <Image source={{ uri: flagUrl }} style={styles.walletFlag} />
                    )}
                    <View>
                        <TextMalet style={styles.walletCurrencyName}>{wallet.currency}</TextMalet>
                        <TextMalet style={styles.walletCurrencyCode}>{wallet.currencyCode}</TextMalet>
                    </View>
                </View>
                <View style={[styles.statusBadge, wallet.status === 'active' && styles.statusActive]}>
                    <TextMalet style={[styles.statusText, wallet.status === 'active' && styles.statusTextActive]}>
                        {wallet.status === 'active' ? 'Activa' : wallet.status}
                    </TextMalet>
                </View>
            </View>

            <View style={styles.walletBalanceSection}>
                <View style={styles.walletBalanceMain}>
                    <TextMalet style={styles.walletBalanceLabel}>Saldo</TextMalet>
                    <TextMalet style={[styles.walletBalanceValue, { color: colors.text }]}>
                        {formatCurrency(wallet.balance)}
                    </TextMalet>
                </View>
                <View style={styles.walletBalanceDivider} />
                <View style={styles.walletBalanceSecondary}>
                    <View style={styles.walletBalanceRow}>
                        <TextMalet style={styles.walletSmallLabel}>Disponible</TextMalet>
                        <TextMalet style={styles.walletSmallValue}>{formatCurrency(wallet.available)}</TextMalet>
                    </View>
                    <View style={styles.walletBalanceRow}>
                        <TextMalet style={styles.walletSmallLabel}>Pendiente</TextMalet>
                        <TextMalet style={styles.walletSmallValue}>{formatCurrency(wallet.pending)}</TextMalet>
                    </View>
                </View>
            </View>

            <View style={styles.walletFooter}>
                <TextMalet style={styles.walletLastUpdate}>
                    Actualizado: {formatDate(wallet.lastUpdate)}
                </TextMalet>
                <TextMalet style={styles.walletId}>ID: {wallet.walletId}</TextMalet>
            </View>
        </View>
    );
});

export default function GarzonWalletScreen() {
    const [walletId, setWalletId] = useState('V');
    const [savedId, setSavedId] = useState<string | null>(null);
    const [walletData, setWalletData] = useState<WalletResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('wallets');

    // Token generation state
    const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [tokenData, setTokenData] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    // Cargar ID guardado al iniciar
    useEffect(() => {
        loadSavedId();
    }, []);

    const loadSavedId = async () => {
        try {
            const storedId = await AsyncStorage.getItem(STORAGE_KEY_WALLET_ID);
            if (storedId) {
                setSavedId(storedId);
                setWalletId(storedId);
                fetchWallet(storedId);
            }
        } catch (err) {
            console.error('Error loading saved ID:', err);
        }
    };

    const fetchWallet = async (id: string) => {
        if (!id.trim()) {
            setError('Por favor ingresa un ID válido');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { response, error } = await secureFetch({
                url: `${MALET_API_URL}/garzon/wallet/${id}`,
                method: 'GET',
            });

            if (error) {
                throw new Error(error || 'Error al consultar wallet');
            }

            setWalletData(response);
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
            setWalletData(null);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = useCallback(() => {
        fetchWallet(walletId);
    }, [walletId]);

    const handleSaveAndSearch = useCallback(async () => {
        if (!walletId.trim()) {
            Alert.alert('Error', 'Por favor ingresa un ID válido');
            return;
        }

        try {
            await AsyncStorage.setItem(STORAGE_KEY_WALLET_ID, walletId);
            setSavedId(walletId);
            fetchWallet(walletId);
        } catch (err) {
            Alert.alert('Error', 'No se pudo guardar el ID');
        }
    }, [walletId]);

    const handleClearSavedId = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_WALLET_ID);
            setSavedId(null);
            setWalletId('V');
            setWalletData(null);
            setError(null);
        } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar el ID');
        }
    }, []);

    const onRefresh = useCallback(() => {
        if (walletId.trim()) {
            setRefreshing(true);
            fetchWallet(walletId);
        }
    }, [walletId]);

    // Token functions
    const toggleWalletSelection = useCallback((walletId: number) => {
        setSelectedWallet(prev => prev === walletId ? null : walletId);
    }, []);

    const generateToken = useCallback(async () => {
        if (!walletData || selectedWallet === null) {
            Alert.alert('Error', 'Selecciona una wallet');
            return;
        }

        setIsGeneratingToken(true);
        setTokenData(null);

        try {
            const wallet = walletData.wallets.find(w => w.walletId === selectedWallet);
            if (!wallet) {
                Alert.alert('Error', 'Wallet no encontrada');
                return;
            }

            const walletsPayload = [{
                id: wallet.walletId,
                moneda: wallet.moneda,
                client_id: walletData.client.id,
            }];

            console.log(walletsPayload)

            const { response, error } = await secureFetch({
                url: `${MALET_API_URL}/garzon/wallet/token`,
                method: 'POST',
                body: JSON.stringify(walletsPayload),
            });

            console.log('ERROR EN LA VAINA ESTA ' + error)

            if (error) {
                throw new Error(error || 'Error al generar token');
            }

            // Assuming the response contains a token string
            const token = typeof response === 'string' ? response : JSON.stringify(response);
            setTokenData(token);
            setShowQRModal(true);

            // Refresh wallet data
            if (savedId) {
                fetchWallet(savedId);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo generar el token');
        } finally {
            setIsGeneratingToken(false);
        }
    }, [walletData, selectedWallet, savedId]);

    const clearWalletSelection = useCallback(() => {
        setSelectedWallet(null);
    }, []);

    const renderWalletItem = useCallback(({ item }: { item: WalletItem }) => (
        <WalletCard wallet={item} />
    ), []);

    const keyExtractor = useCallback((item: WalletItem) => item.walletId.toString(), []);

    const ListHeaderComponent = useCallback(() => (
        <>
            {/* Error */}
            {error && (
                <View style={styles.errorContainer}>
                    <TextMalet style={styles.errorText}>{error}</TextMalet>
                </View>
            )}

            {/* Info del cliente */}
            {walletData && (
                <View style={styles.clientCard}>
                    <View style={styles.clientHeader}>
                        <View style={styles.clientAvatar}>
                            <TextMalet style={styles.clientAvatarText}>
                                {walletData.client.name.charAt(0).toUpperCase()}
                            </TextMalet>
                        </View>
                        <View style={styles.clientInfo}>
                            <TextMalet style={styles.clientName}>{walletData.client.name}</TextMalet>
                            <TextMalet style={styles.clientId}>{walletData.client.idNumber}</TextMalet>
                        </View>
                        <View style={styles.clientIdBadge}>
                            <TextMalet style={styles.clientIdBadgeText}>#{walletData.client.id}</TextMalet>
                        </View>
                    </View>

                    {walletData.client.email && (
                        <View style={styles.clientContactRow}>
                            <TextMalet style={styles.clientContactLabel}>Email</TextMalet>
                            <TextMalet style={styles.clientContactValue} numberOfLines={1}>
                                {walletData.client.email}
                            </TextMalet>
                        </View>
                    )}

                    {walletData.client.mobile && (
                        <View style={styles.clientContactRow}>
                            <TextMalet style={styles.clientContactLabel}>Móvil</TextMalet>
                            <TextMalet style={styles.clientContactValue}>
                                {walletData.client.mobile}
                            </TextMalet>
                        </View>
                    )}

                    {/* Resumen de wallets */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <TextMalet style={styles.summaryValue}>{walletData.summary.totalWallets}</TextMalet>
                            <TextMalet style={styles.summaryLabel}>Wallets</TextMalet>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <TextMalet style={styles.summaryValue}>{walletData.summary.activeWallets}</TextMalet>
                            <TextMalet style={styles.summaryLabel}>Activas</TextMalet>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <TextMalet style={styles.summaryValue}>{walletData.summary.currencies.length}</TextMalet>
                            <TextMalet style={styles.summaryLabel}>Monedas</TextMalet>
                        </View>
                    </View>
                </View>
            )}

            {/* Título de wallets */}
            {walletData && walletData.wallets.length > 0 && (
                <View style={styles.walletsHeader}>
                    <TextMalet style={styles.walletsTitle}>Mis Wallets</TextMalet>
                    <TextMalet style={styles.walletsSubtitle}>
                        {walletData.wallets.length} {walletData.wallets.length === 1 ? 'wallet' : 'wallets'} disponibles
                    </TextMalet>
                </View>
            )}
        </>
    ), [error, walletData]);

    const ListEmptyComponent = useCallback(() => {
        if (isLoading || error || !walletData) return null;
        return (
            <View style={styles.emptyState}>
                <TextMalet style={styles.emptyStateText}>
                    No tienes wallets registradas
                </TextMalet>
            </View>
        );
    }, [isLoading, error, walletData]);

    const ListFooterComponent = useCallback(() => {
        if (!walletData && !isLoading && !error) {
            return (
                <View style={styles.emptyState}>
                    <TextMalet style={styles.emptyStateText}>
                        Ingresa tu cédula para consultar tus wallets
                    </TextMalet>
                </View>
            );
        }
        return <View style={{ height: 20 }} />;
    }, [walletData, isLoading, error]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GarzonHeader
                isAuthenticated={false}
                isLoading={isLoading || isGeneratingToken}
                onRefresh={onRefresh}
                onLogout={() => { }}
            />

            {/* Sección de búsqueda */}
            <View style={styles.searchSection}>
                <TextMalet style={styles.sectionTitle}>Consultar Wallet</TextMalet>

                {savedId ? (
                    <View style={styles.savedIdContainer}>
                        <View style={styles.savedIdInfo}>
                            <TextMalet style={styles.savedIdLabel}>Consultando con ID:</TextMalet>
                            <TextMalet style={styles.savedIdValue}>{savedId}</TextMalet>
                        </View>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClearSavedId}
                        >
                            <TextMalet style={styles.clearButtonText}>Cambiar</TextMalet>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <TextMalet style={styles.sectionSubtitle}>
                            Ingresa tu cédula para ver tus wallets
                        </TextMalet>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: V12345678"
                                placeholderTextColor="#9CA3AF"
                                value={walletId}
                                onChangeText={setWalletId}
                                autoCapitalize="characters"
                                keyboardType="numeric"
                            />
                        </View>

                        <Button
                            text="Guardar y consultar"
                            onPress={handleSaveAndSearch}
                            loading={isLoading}
                            disabled={!walletId.trim() || walletId === 'V'}
                        />
                    </>
                )}
            </View>

            {/* Tabs - Solo mostrar si hay datos */}
            {walletData && (
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'wallets' && styles.tabActive]}
                        onPress={() => setActiveTab('wallets')}
                    >
                        <TextMalet style={[styles.tabText, activeTab === 'wallets' && styles.tabTextActive]}>
                            Mis Wallets
                        </TextMalet>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'tokens' && styles.tabActive]}
                        onPress={() => setActiveTab('tokens')}
                    >
                        <TextMalet style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>
                            Generar Token
                        </TextMalet>
                    </TouchableOpacity>
                </View>
            )}

            {/* Contenido según tab activo */}
            {isLoading && !walletData ? (
                <LoadingSkeleton />
            ) : activeTab === 'wallets' ? (
                <FlatList
                    data={walletData?.wallets || []}
                    renderItem={renderWalletItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={ListHeaderComponent}
                    ListEmptyComponent={ListEmptyComponent}
                    ListFooterComponent={ListFooterComponent}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    keyboardShouldPersistTaps="handled"
                />
            ) : (
                /* Tab de generación de tokens */
                <ScrollView
                    style={styles.tokenContainer}
                    contentContainerStyle={styles.tokenContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.tokenHeader}>
                        <TextMalet style={styles.tokenTitle}>Seleccionar Wallet</TextMalet>
                        <TouchableOpacity onPress={clearWalletSelection}>
                            <TextMalet style={styles.tokenActionText}>Limpiar</TextMalet>
                        </TouchableOpacity>
                    </View>

                    {walletData?.wallets.map((wallet) => (
                        <TouchableOpacity
                            key={wallet.walletId}
                            style={[
                                styles.tokenWalletItem,
                                selectedWallet === wallet.walletId && styles.tokenWalletItemSelected,
                            ]}
                            onPress={() => toggleWalletSelection(wallet.walletId)}
                        >
                            <View style={styles.tokenWalletInfo}>
                                <Image
                                    source={{ uri: CURRENCY_FLAGS[wallet.currencyCode] }}
                                    style={styles.walletFlag}
                                />
                                <View>
                                    <TextMalet style={styles.tokenWalletName}>{wallet.currency}</TextMalet>
                                    <TextMalet style={styles.tokenWalletCode}>{wallet.currencyCode}</TextMalet>
                                </View>
                            </View>
                            <View style={[
                                styles.tokenCheckbox,
                                selectedWallet === wallet.walletId && styles.tokenCheckboxSelected,
                            ]}>
                                {selectedWallet === wallet.walletId && (
                                    <TextMalet style={styles.tokenCheckmark}>✓</TextMalet>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.tokenGenerateSection}>
                        <TextMalet style={styles.tokenSelectedCount}>
                            {selectedWallet !== null ? '1 wallet seleccionada' : 'Ninguna wallet seleccionada'}
                        </TextMalet>
                        <Button
                            text="Generar Token QR"
                            onPress={generateToken}
                            loading={isGeneratingToken}
                            disabled={selectedWallet === null}
                        />
                    </View>
                </ScrollView>
            )}

            {/* Modal de QR */}
            <ModalOptions
                visible={showQRModal}
                onClose={() => setShowQRModal(false)}
            >
                <View>
                    <View style={styles.qrModalContainer}>
                        <TextMalet style={styles.qrModalTitle}>Token Generado</TextMalet>
                        <TextMalet style={styles.qrModalSubtitle}>
                            Escanea este código para usar tu wallet
                        </TextMalet>

                        {tokenData && (
                            <View style={styles.qrCodeContainer}>
                                <QRCode
                                    value={tokenData}
                                    size={200}
                                    backgroundColor="white"
                                    color="black"
                                    logo={require('@/assets/images/malet/malet.png')}
                                    logoSize={40}
                                    logoBackgroundColor="white"
                                    logoMargin={4}
                                    logoBorderRadius={8}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.qrCloseButton}
                            onPress={() => {
                                setShowQRModal(false);
                                setTokenData(null);
                                setSelectedWallet(null);
                            }}
                        >
                            <TextMalet style={styles.qrCloseButtonText}>Cerrar</TextMalet>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalOptions>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    searchSection: {
        paddingVertical: 8,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#1F2937',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 10,
        marginTop: 5,
    },
    // ID guardado
    savedIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#D1FAE5',
        borderRadius: 10,
        padding: 14,
        marginTop: 8,
    },
    savedIdInfo: {
        flex: 1,
    },
    savedIdLabel: {
        fontSize: 11,
        color: '#059669',
        marginBottom: 2,
    },
    savedIdValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#047857',
    },
    clearButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#059669',
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#1F2937',
    },
    savedBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    savedBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    searchButton: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    clearText: {
        fontSize: 12,
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 4,
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 13,
        color: '#DC2626',
        textAlign: 'center',
    },
    // Client Card
    clientCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 16,
    },
    clientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    clientAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    clientAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    clientId: {
        fontSize: 13,
        color: '#6B7280',
    },
    clientIdBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    clientIdBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4338CA',
    },
    clientContactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    clientContactLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    clientContactValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1F2937',
        maxWidth: '60%',
        textAlign: 'right',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#10B981',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    // Wallets List
    walletsHeader: {
        marginBottom: 12,
    },
    walletsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    walletsSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    // Wallet Card
    walletCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        overflow: 'hidden',
    },
    walletCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    walletCurrencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    walletFlag: {
        width: 28,
        height: 20,
        borderRadius: 3,
    },
    walletCurrencyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    walletCurrencyCode: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    statusBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusActive: {
        backgroundColor: '#D1FAE5',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
    },
    statusTextActive: {
        color: '#059669',
    },
    walletBalanceSection: {
        flexDirection: 'row',
        padding: 14,
    },
    walletBalanceMain: {
        flex: 1,
        alignItems: 'center',
    },
    walletBalanceLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    walletBalanceValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    walletBalanceDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    walletBalanceSecondary: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    walletBalanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletSmallLabel: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    walletSmallValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    walletFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    walletLastUpdate: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    walletId: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#1F2937',
        fontWeight: '600',
    },
    // Token generation
    tokenContainer: {
        flex: 1,
    },
    tokenContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    tokenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    tokenActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tokenActionText: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '500',
    },
    tokenActionDivider: {
        fontSize: 13,
        color: '#D1D5DB',
    },
    tokenWalletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        marginBottom: 10,
    },
    tokenWalletItemSelected: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    tokenWalletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tokenWalletName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    tokenWalletCode: {
        fontSize: 11,
        color: '#6B7280',
    },
    tokenCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tokenCheckboxSelected: {
        borderColor: '#10B981',
        backgroundColor: '#10B981',
    },
    tokenCheckmark: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    tokenGenerateSection: {
        marginTop: 16,
        gap: 12,
    },
    tokenSelectedCount: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
    },
    qrModalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    qrModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    qrModalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    qrCodeContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    qrCloseButton: {
        backgroundColor: '#1F2937',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    qrCloseButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
