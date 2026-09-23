import { InputField } from '@/components/AddWallet';
import Button from '@/components/Button/Button';
import GarzonHeader from '@/components/garzon/GarzonHeader';
import ModalOptions from '@/components/shared/ModalOptions';
import Switch from '@/components/Switch/Switch';
import TextMalet from '@/components/TextMalet/TextMalet';
import { MALET_API_URL } from '@/shared/config/malet.config';
import { secureFetch } from '@/shared/http/secureFetch';
import { useGarzonStore } from '@/shared/stores/useGarzonStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

const CODE128_PATTERNS: Record<string, number[]> = {
    'START': [2, 1, 1, 2, 3, 2],
    'STOP': [2, 3, 3, 1, 1, 1, 2],
    '0': [1, 1, 2, 2, 3, 2], '1': [1, 1, 2, 3, 2, 2], '2': [1, 1, 3, 2, 2, 2],
    '3': [1, 2, 1, 1, 3, 3], '4': [1, 2, 1, 3, 1, 3], '5': [1, 3, 1, 1, 2, 3],
    '6': [1, 2, 3, 1, 1, 3], '7': [1, 3, 2, 1, 1, 3], '8': [1, 3, 2, 3, 1, 1],
    '9': [2, 1, 1, 2, 2, 3], 'A': [2, 1, 1, 3, 2, 2], 'B': [2, 3, 1, 1, 2, 2],
    'C': [1, 1, 2, 1, 3, 3], 'D': [1, 1, 2, 3, 3, 1], 'E': [1, 3, 2, 1, 3, 1],
    'F': [1, 1, 3, 1, 2, 3], 'G': [1, 1, 3, 3, 2, 1], 'H': [1, 3, 3, 1, 2, 1],
    'I': [2, 1, 1, 1, 2, 4], 'J': [2, 1, 1, 1, 4, 2], 'K': [2, 1, 4, 1, 1, 2],
    'L': [2, 4, 1, 1, 1, 2], 'M': [4, 1, 1, 2, 1, 2], 'N': [4, 1, 1, 2, 2, 1],
    'O': [2, 1, 2, 1, 2, 3], 'P': [2, 1, 2, 3, 2, 1], 'Q': [2, 3, 2, 1, 2, 1],
    'R': [1, 1, 1, 3, 2, 3], 'S': [1, 3, 1, 1, 2, 3], 'T': [1, 3, 1, 3, 2, 1],
    'U': [1, 1, 2, 3, 2, 2], 'V': [1, 1, 4, 1, 2, 2], 'W': [1, 2, 4, 1, 1, 2],
    'X': [1, 2, 2, 1, 4, 1], 'Y': [1, 2, 2, 4, 1, 1], 'Z': [1, 4, 2, 1, 2, 1],
};

const STORAGE_KEY_WALLET_ID = 'garzon_wallet_id';

const CURRENCY_FLAGS: Record<string, string> = {
    COP: 'https://flagcdn.com/w40/co.png',
    USD: 'https://flagcdn.com/w40/us.png',
    BS: 'https://flagcdn.com/w40/ve.png',
    PTG: 'https://flagcdn.com/w40/ve.png',
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

type ModeType = 'wallets' | 'token';

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

interface TokenWalletData {
    id: number;
    moneda: number;
    cliente_id: number;
    token: string;
    date_token: string;
}

interface TokenDataItem {
    code: number;
    wallet: TokenWalletData;
    message: string;
}

interface TokenResponse {
    success: boolean;
    message: string;
    data: TokenDataItem[];
    requestedWallets: number;
}

const formatCurrency = (value: number) =>
    value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SimpleBarcode = memo(({ value, width = 280, height = 80 }: { value: string; width?: number; height?: number }) => {
    const bars = (() => {
        const result: { x: number; width: number }[] = [];
        const padding = 8;
        const patterns: number[][] = [CODE128_PATTERNS['START']];
        for (const char of value.toUpperCase()) {
            patterns.push(CODE128_PATTERNS[char] || [1, 2, 1, 2, 1, 2]);
        }
        patterns.push(CODE128_PATTERNS['STOP']);
        const totalUnits = patterns.reduce((s, p) => s + p.reduce((a, b) => a + b, 0), 0);
        const unitWidth = (width - padding * 2) / totalUnits;
        let x = padding;
        for (const pattern of patterns) {
            for (let i = 0; i < pattern.length; i++) {
                const w = pattern[i] * unitWidth;
                if (i % 2 === 0) result.push({ x, width: Math.max(w, 1) });
                x += w;
            }
        }
        return result;
    })();

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {bars.map((bar, i) => (
                <Rect key={i} x={bar.x} y={4} width={bar.width} height={height - 8} fill="#000" />
            ))}
        </Svg>
    );
});

const SkeletonBlock = memo(({ w, h, circle }: { w: number | string; h: number; circle?: boolean }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={{ width: w as any, height: h, backgroundColor: '#E5E5E5', borderRadius: circle ? w as any / 2 : 4, opacity }}
        />
    );
});

const LoadingSkeleton = memo(() => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <SkeletonBlock w={44} h={44} circle />
            <View style={{ marginLeft: 12, flex: 1, gap: 6 }}>
                <SkeletonBlock w={140} h={16} />
                <SkeletonBlock w={90} h={12} />
            </View>
        </View>
        <View style={{ gap: 12 }}>
            {[1, 2].map(i => (
                <View key={i} style={{ backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <SkeletonBlock w={28} h={20} />
                        <View style={{ flex: 1, gap: 4 }}>
                            <SkeletonBlock w={80} h={14} />
                            <SkeletonBlock w={30} h={10} />
                        </View>
                    </View>
                    <SkeletonBlock w={120} h={28} />
                </View>
            ))}
        </View>
    </View>
));

const WalletCard = memo(({ wallet, onGenerate }: { wallet: WalletItem; onGenerate?: (id: number) => void }) => {
    const flagUrl = CURRENCY_FLAGS[wallet.currencyCode];
    const isActive = wallet.status === 'active';

    return (
        <View style={s.walletCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {flagUrl && <Image source={{ uri: flagUrl }} style={s.flag} />}
                    <View>
                        <TextMalet style={s.currencyName}>{wallet.currency}</TextMalet>
                        <TextMalet style={s.currencyCode}>{wallet.currencyCode}</TextMalet>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <TextMalet style={s.balance}>{formatCurrency(wallet.balance)}</TextMalet>
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 8, gap: 20 }}>
                <TextMalet style={s.metaCompact}>Disp: {formatCurrency(wallet.available)}</TextMalet>
                <TextMalet style={s.metaCompact}>Pend: {formatCurrency(wallet.pending)}</TextMalet>
                <TextMalet style={s.walletIdCompact}>#{wallet.walletId}</TextMalet>
            </View>

            {onGenerate && (
                <Button
                    style={s.generateBtn}
                    onPress={() => onGenerate(wallet.walletId)}
                    text={"Generar Token"}
                />
            )}
        </View>
    );
});

export default function GarzonWalletScreen() {
    const garzonIsAuthenticated = useGarzonStore(s => s.isAuthenticated);
    const garzonLogout = useGarzonStore(s => s.logout);
    const [walletId, setWalletId] = useState('V');
    const [savedId, setSavedId] = useState<string | null>(null);
    const [walletData, setWalletData] = useState<WalletResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [mode, setMode] = useState<ModeType>('wallets');
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [tokenData, setTokenData] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [modalCodeTab, setModalCodeTab] = useState<'qr' | 'barcode'>('qr');
    const [showIDModal, setShowIDModal] = useState(false);
    const [keypadDigits, setKeypadDigits] = useState('');

    useEffect(() => { loadSavedId(); }, []);

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
        if (!id.trim()) { setError('Ingresa un ID válido'); return; }
        setIsLoading(true);
        setError(null);
        try {
            const { response, error } = await secureFetch<WalletResponse>({
                url: `${MALET_API_URL}/garzon/wallet/${id}`,
                method: 'GET',
            });
            if (error) throw new Error(error || 'Error al consultar wallet');
            setWalletData(response);
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
            setWalletData(null);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const openIDModal = useCallback(() => {
        setKeypadDigits(savedId ? savedId.replace('V', '') : '');
        setShowIDModal(true);
    }, [savedId]);

    const handleKeypadConfirm = useCallback(async () => {
        if (!keypadDigits.trim()) { Alert.alert('Error', 'Ingresa un número de cédula'); return; }
        const fullId = 'V' + keypadDigits;
        try {
            await AsyncStorage.setItem(STORAGE_KEY_WALLET_ID, fullId);
            setSavedId(fullId);
            setWalletId(fullId);
            setShowIDModal(false);
            setError(null);
            fetchWallet(fullId);
        } catch { Alert.alert('Error', 'No se pudo guardar el ID'); }
    }, [keypadDigits]);

    const onRefresh = useCallback(() => {
        if (walletId.trim()) { setRefreshing(true); fetchWallet(walletId); }
    }, [walletId]);

    const handleGenerateToken = useCallback(async (selectedWalletId: number) => {
        if (!walletData) return;
        setTokenData(null);
        setShowQRModal(true);
        setIsGeneratingToken(true);
        try {
            const wallet = walletData.wallets.find(w => w.walletId === selectedWalletId);
            if (!wallet) { setShowQRModal(false); Alert.alert('Error', 'Wallet no encontrada'); return; }
            const { response, error } = await secureFetch<TokenResponse>({
                url: `${MALET_API_URL}/garzon/wallet/token`,
                method: 'POST',
                body: [{ id: wallet.walletId, moneda: wallet.moneda, client_id: walletData.client.id }],
            });
            if (error) { setShowQRModal(false); throw new Error(error || 'Error al generar token'); }
            if (!response?.success || !response?.data?.[0]?.wallet?.token) {
                setShowQRModal(false);
                throw new Error(response?.message || 'No se recibió un token válido');
            }
            setTokenData(response.data[0].wallet.token.toUpperCase());
            if (savedId) fetchWallet(savedId);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo generar el token');
        } finally {
            setIsGeneratingToken(false);
        }
    }, [walletData, savedId]);

    const copyToClipboard = useCallback(async () => {
        if (tokenData) {
            await Clipboard.setStringAsync(tokenData);
            Alert.alert('Copiado', 'Código copiado al portapapeles');
        }
    }, [tokenData]);

    const closeModal = useCallback(() => {
        if (!isGeneratingToken) {
            setShowQRModal(false);
            setTokenData(null);
        }
    }, [isGeneratingToken]);

    const renderWalletItem = useCallback(({ item }: { item: WalletItem }) => (
        <WalletCard wallet={item} />
    ), []);

    const renderTokenWalletItem = useCallback(({ item }: { item: WalletItem }) => (
        <WalletCard wallet={item} onGenerate={handleGenerateToken} />
    ), [handleGenerateToken]);

    const keyExtractor = useCallback((item: WalletItem) => item.walletId.toString(), []);

    const renderUnifiedHeader = useCallback(() => {
        if (!walletData) return null;
        return (
            <View>
                {error && (
                    <View style={s.errorBox}>
                        <TextMalet style={s.errorLabel}>{error}</TextMalet>
                    </View>
                )}

                <View style={s.clientCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={s.avatar}>
                            <TextMalet style={s.avatarText}>
                                {walletData.client.name.charAt(0).toUpperCase()}
                            </TextMalet>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <TextMalet style={s.clientName}>{walletData.client.name}</TextMalet>
                            <TextMalet style={s.clientIdNumber}>{walletData.client.idNumber}</TextMalet>
                        </View>
                        <View style={s.clientIdBox}>
                            <TextMalet style={s.clientIdText}>#{walletData.client.id}</TextMalet>
                        </View>
                    </View>
                </View>

                {walletData.wallets.length > 0 && (
                    <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12 }}>
                        <Switch
                            options={[
                                { value: 'wallets', label: 'Wallets' },
                                { value: 'token', label: 'Token' },
                            ]}
                            selected={mode}
                            onSelect={(v) => setMode(v as ModeType)}
                        />
                    </View>
                )}
            </View>
        );
    }, [error, walletData, mode]);

    const renderWalletsTitle = useCallback(() => {
        if (!walletData || walletData.wallets.length === 0) return null;
        return (
            <View style={{ marginBottom: 12 }}>
                <TextMalet style={s.sectionTitle}>Mis Wallets</TextMalet>
                <TextMalet style={s.sectionSub}>
                    {walletData.wallets.length} {walletData.wallets.length === 1 ? 'wallet' : 'wallets'} disponibles
                </TextMalet>
            </View>
        );
    }, [walletData]);

    const renderTokenPrompt = useCallback(() => (
        <TextMalet style={s.tokenSectionTitle}>Toca una wallet para generar su token</TextMalet>
    ), []);

    const renderEmpty = useCallback(() => {
        if (isLoading || error || !walletData) return null;
        return (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <TextMalet style={{ fontSize: 14, color: '#999' }}>No tienes wallets registradas</TextMalet>
            </View>
        );
    }, [isLoading, error, walletData]);

    const renderInitialFooter = useCallback(() => {
        if (!walletData && !isLoading && !error) {
            return (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                    <TextMalet style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
                        Ingresa tu cédula para consultar tus wallets
                    </TextMalet>
                </View>
            );
        }
        return null;
    }, [walletData, isLoading, error]);

    const renderQRContent = useCallback(() => {
        if (isGeneratingToken || !tokenData) return null;

        return (
            <View style={{ width: '100%' }}>
                <Switch
                    options={[
                        { value: 'qr', label: 'QR' },
                        { value: 'barcode', label: 'Barras' },
                    ]}
                    selected={modalCodeTab}
                    onSelect={(v) => setModalCodeTab(v as 'qr' | 'barcode')}
                    style={{ marginBottom: 16 }}
                />

                <TouchableOpacity style={s.codeBox} onPress={copyToClipboard} activeOpacity={0.7}>
                    <TextMalet style={s.codeValue}>{tokenData}</TextMalet>
                </TouchableOpacity>

                {modalCodeTab === 'qr' ? (
                    <View style={s.qrWrap}>
                        <QRCode
                            value={tokenData}
                            size={200}
                            backgroundColor="white"
                            color="#000"
                        />
                    </View>
                ) : (
                    <View style={s.barcodeWrap}>
                        <SimpleBarcode value={tokenData} width={280} height={80} />
                    </View>
                )}
            </View>
        );
    }, [isGeneratingToken, tokenData, modalCodeTab, copyToClipboard, closeModal]);

    const handleLogout = useCallback(() => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar la sesión de Garzón?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await garzonLogout();
                        setWalletData(null);
                    },
                },
            ]
        );
    }, [garzonLogout]);

    return (
        <SafeAreaView style={s.screen} edges={['top']}>
            <GarzonHeader
                isAuthenticated={garzonIsAuthenticated}
                isLoading={isLoading || isGeneratingToken}
                onRefresh={onRefresh}
                onLogout={handleLogout}
            />

            <View style={s.idBar}>
                <View style={{ flex: 1 }}>
                    <TextMalet style={s.idLabel}>Cédula</TextMalet>
                    <TextMalet style={s.idValue}>{savedId || 'No ingresada'}</TextMalet>
                </View>
                <Button 
                    onPress={openIDModal}
                    text="Cambiar" 
                />
            </View>

            {renderUnifiedHeader()}

            {!walletData && isLoading ? (
                <LoadingSkeleton />
            ) : mode === 'wallets' ? (
                <FlatList
                    data={walletData?.wallets || []}
                    renderItem={renderWalletItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={renderWalletsTitle}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderInitialFooter}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    keyboardShouldPersistTaps="handled"
                />
            ) : (
                <FlatList
                    data={walletData?.wallets || []}
                    renderItem={renderTokenWalletItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={renderTokenPrompt}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            <ModalOptions visible={showQRModal} onClose={closeModal} heightRatio={0.52}>
                <View style={s.modalContent}>
                    {isGeneratingToken ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ActivityIndicator size="large" color="#000" />
                            <TextMalet style={s.modalTitle}>Generando Token</TextMalet>
                            <TextMalet style={s.modalSub}>Por favor espera</TextMalet>
                        </View>
                    ) : (
                        <>
                            {renderQRContent()}
                        </>
                    )}
                </View>
            </ModalOptions>

            <ModalOptions visible={showIDModal} onClose={() => setShowIDModal(false)} isOnTop heightRatio={0.3}>
                <View style={{ alignItems: 'center', width: '100%', maxWidth: 320, gap: 16 }}>
                    <TextMalet style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>Cambiar Cédula</TextMalet>

                    <InputField
                        label="Número de cédula"
                        placeholder="Ej: 12345678"
                        value={keypadDigits}
                        onChangeText={(t) => setKeypadDigits(t.replace(/[^0-9]/g, ''))}
                        keyboardType="phone-pad"
                    />

                    <Button
                        onPress={handleKeypadConfirm}
                        disabled={!keypadDigits || isLoading}
                        text={isLoading ? 'Guardando...' : 'Guardar'}
                    />
                    
                </View>
            </ModalOptions>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        paddingBottom: 32,
    },
    idBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 14,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
    },
    idLabel: {
        fontSize: 11,
        color: '#999',
        marginBottom: 2,
    },
    idValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    idChangeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    errorBox: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF5F5',
        borderRadius: 10,
    },
    errorLabel: {
        fontSize: 13,
        color: '#D32F2F',
        textAlign: 'center',
    },
    clientCard: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    clientIdNumber: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    clientIdBox: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D1D1',
    },
    clientIdText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
    },
    clientMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    metaItem: {
        flex: 1,
        alignItems: 'center',
    },
    metaDivider: {
        width: 1,
        height: 28,
        backgroundColor: '#E8E8E8',
    },
    metaValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    metaLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    walletCard: {
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        padding: 12,
    },
    flag: {
        width: 24,
        height: 17,
        borderRadius: 2,
    },
    currencyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    currencyCode: {
        fontSize: 10,
        color: '#999',
        marginTop: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D1D1',
    },
    statusDotActive: {
        backgroundColor: '#2E7D32',
    },
    balance: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
    },
    metaCompact: {
        fontSize: 11,
        color: '#999',
    },
    walletIdCompact: {
        fontSize: 10,
        color: '#D1D1D1',
        marginLeft: 'auto' as any,
    },
    generateBtn: {
        marginTop: 10,
        paddingVertical: 10,
    },
    generateBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginHorizontal: 16,
        marginBottom: 2,
    },
    sectionSub: {
        fontSize: 12,
        color: '#999',
        marginHorizontal: 16,
    },
    tokenSectionTitle: {
        fontSize: 13,
        color: '#999',
        marginHorizontal: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalContent: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginTop: 8,
    },
    modalSub: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 4,
    },
    codeBox: {
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        width: '100%',
    },
    codeValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 6,
        textAlign: 'center',
    },
    qrWrap: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        alignItems: 'center',
    },
    barcodeWrap: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    doneBtn: {
        backgroundColor: '#000',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        width: '100%',
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
