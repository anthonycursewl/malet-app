import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LastTransactions from "@/components/dashboard/LastTransactions";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import UpdatesModal from "@/components/Modals/UpdatesModal/UpdatesModal";
import TextMalet from "@/components/TextMalet/TextMalet";
import { parseDate } from "@/shared/services/date/parseDate";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useTagStore } from "@/shared/stores/useTagStore";
import { useToastStore } from "@/shared/stores/useToastStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { useAnalyticsStore } from "@/shared/stores/useAnalyticsStore";
import { useSharedAccountStore } from "@/shared/stores/useSharedAccountStore";
import IconArrow from "@/svgs/dashboard/IconArrow";
import IconAt from "@/svgs/dashboard/IconAt";
import IconVerified from "@/svgs/common/IconVerified";
import { VERIFICATION_TYPES } from "@/shared/constants/VERIFICATION_DETAILS";
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, Path, Pattern, Rect, Stop, LinearGradient as SvgLinearGradient, Text } from 'react-native-svg';

// lucide icon 
import { getCurrencyIcon } from "@/shared/services/currency/currencyService";
import { ArrowRight, Layers, Plus, ShoppingCart, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';

const SHOW_S_ACCOUNTS_NEW_TAG = (() => {
    const releaseDate = new Date('2026-02-26');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 10;
})();

interface ModalAccountsRef {
    openModal: () => void;
}

const LoadingScreen = memo(({ fadeAnim, logoFadeAnim }: { fadeAnim: Animated.Value, logoFadeAnim: Animated.Value }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-80, 150],
    });

    return (
        <Animated.View style={[loadingStyles.container, { opacity: fadeAnim }]}>
            <View style={loadingStyles.content}>
                <Animated.View style={[loadingStyles.logoContainer, { opacity: logoFadeAnim }]}>
                    <IconAt width={56} height={56} />
                </Animated.View>

                {/* Thin metallic shimmer bar */}
                <View style={loadingStyles.loadingBarContainer}>
                    <LinearGradient
                        colors={['#e2e8f0', '#cbd5e1', '#e2e8f0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View
                        style={[
                            loadingStyles.shimmerWrapper,
                            { transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }] }
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
            </View>

            <View style={loadingStyles.footer}>
                <TextMalet style={loadingStyles.footerTextLight}>from</TextMalet>
                <TextMalet style={loadingStyles.footerTextBold}>Breadriuss</TextMalet>
            </View>
        </Animated.View>
    );
});

const loadingStyles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#fff',
        zIndex: 100,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 50,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingBarContainer: {
        width: 130,
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    shimmerWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '40%',
        left: 0,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    footerTextLight: {
        fontSize: 13,
        color: '#94a3b8',
    },
    footerTextBold: {
        fontSize: 16,
        color: '#1e293b',
        marginTop: 2,
    }
});

const DIGIT_H = 34;
const DIGIT_W = 17;

const DigitColumn = memo(({ digit }: { digit: number }) => {
    const anim = useRef(new Animated.Value(digit)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: digit,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, [digit]);

    const translateY = anim.interpolate({
        inputRange: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        outputRange: [0, -DIGIT_H, -2 * DIGIT_H, -3 * DIGIT_H, -4 * DIGIT_H, -5 * DIGIT_H, -6 * DIGIT_H, -7 * DIGIT_H, -8 * DIGIT_H, -9 * DIGIT_H],
    });

    return (
        <View style={{ width: DIGIT_W, height: DIGIT_H, overflow: 'hidden' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
                {'0123456789'.split('').map(d => (
                    <TextMalet
                        key={d}
                        style={{ fontSize: DIGIT_H, lineHeight: DIGIT_H, fontWeight: '700', color: '#0f172a', textAlign: 'center', height: DIGIT_H }}
                    >
                        {d}
                    </TextMalet>
                ))}
            </Animated.View>
        </View>
    );
});

const RollingNumber = memo(({ value }: { value: string }) => {
    if (value.includes('***') || value === 'General') {
        return <TextMalet style={styles.balanceValue}>{value}</TextMalet>;
    }

    const parts = value.split(' ');
    const numberPart = parts[0];
    const suffix = parts.slice(1).join(' ');

    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            {numberPart.split('').map((char, i) => {
                if (char >= '0' && char <= '9') {
                    return <DigitColumn key={`d-${i}`} digit={parseInt(char, 10)} />;
                }
                return (
                    <TextMalet
                        key={char === '.' ? `dot-${i}` : `sep-${i}`}
                        style={{ fontSize: DIGIT_H, lineHeight: DIGIT_H, fontWeight: '700', color: '#0f172a', width: char === '.' ? 10 : 8, textAlign: 'center' }}
                    >
                        {char}
                    </TextMalet>
                );
            })}
            {suffix ? (
                <TextMalet style={{ fontSize: 14, color: '#64748b', marginLeft: 6, fontWeight: '500' }}>
                    {suffix}
                </TextMalet>
            ) : null}
        </View>
    );
});

const TICKET_W = 162;
const TICKET_H = 78;

const GoldenTicket = memo(({ onPress }: { onPress: () => void }) => {
    const scallopSpacing = 12;
    const scallopR = 5;
    const numTopBottom = Math.floor(TICKET_W / scallopSpacing) - 1;
    const numLeftRight = Math.floor(TICKET_H / scallopSpacing) - 1;
    const tearOffX = TICKET_W - 36;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                width: TICKET_W + 8,
                height: TICKET_H + 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
            }}
        >
            <View style={{ transform: [{ rotate: '-1.5deg' }], width: TICKET_W, height: TICKET_H }}>
                <Svg width={TICKET_W} height={TICKET_H}>
                    <Defs>
                        <SvgLinearGradient id="brdTicketGold" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor="#f3a65e" />
                            <Stop offset="0.35" stopColor="#f5d76e" />
                            <Stop offset="0.7" stopColor="#e8b830" />
                            <Stop offset="1" stopColor="#ac79ce" />
                        </SvgLinearGradient>
                    </Defs>

                    {/* Main golden body */}
                    <Rect x={0} y={0} width={TICKET_W} height={TICKET_H} rx={6} fill="url(#brdTicketGold)" />

                    {/* Scallops - top */}
                    {Array.from({ length: numTopBottom }).map((_, i) => (
                        <Circle key={`t${i}`} cx={scallopSpacing * (i + 1)} cy={0} r={scallopR} fill="#fff" />
                    ))}

                    {/* Scallops - bottom */}
                    {Array.from({ length: numTopBottom }).map((_, i) => (
                        <Circle key={`b${i}`} cx={scallopSpacing * (i + 1)} cy={TICKET_H} r={scallopR} fill="#fff" />
                    ))}

                    {/* Scallops - left */}
                    {Array.from({ length: numLeftRight }).map((_, i) => (
                        <Circle key={`l${i}`} cx={0} cy={scallopSpacing * (i + 1)} r={scallopR} fill="#fff" />
                    ))}

                    {/* Scallops - right */}
                    {Array.from({ length: numLeftRight }).map((_, i) => (
                        <Circle key={`r${i}`} cx={TICKET_W} cy={scallopSpacing * (i + 1)} r={scallopR} fill="#fff" />
                    ))}

                    {/* Inner border */}
                    <Rect x={10} y={10} width={tearOffX - 14} height={TICKET_H - 20} rx={4} fill="none" stroke="#b8931a" strokeWidth={1.5} />

                    {/* Tear-off dashed line */}
                    <Line x1={tearOffX} y1={8} x2={tearOffX} y2={TICKET_H - 8} stroke="#eeb281" strokeWidth={1} strokeDasharray="4 3" />

                    {/* Stars in tear-off */}
                    {[0, 1, 2].map(i => (
                        <Text
                            key={`s${i}`}
                            x={tearOffX + (TICKET_W - tearOffX) / 2}
                            y={22 + i * 20}
                            textAnchor="middle"
                            fill="#b8931a"
                            fontSize={13}
                        >
                            ★
                        </Text>
                    ))}
                </Svg>

                {/* Content overlay */}
                <View style={{ position: 'absolute', top: 0, left: 0, width: TICKET_W, height: TICKET_H, flexDirection: 'row', alignItems: 'center', paddingLeft: 14 }}>
                    <Image
                        source={{ uri: 'https://bucket.breadriuss.com/brd/brd_lg_dark.webp' }}
                        style={{ width: 22, height: 22 }}
                    />
                    <View style={{ marginLeft: 8, flexShrink: 1 }}>
                        <TextMalet style={{ fontSize: 13, fontWeight: '700', color: '#3d2a00', letterSpacing: 0.3 }}>
                            Breadriuss
                        </TextMalet>
                        <TextMalet style={{ fontSize: 10, fontWeight: '500', color: '#6b4c00', letterSpacing: 0.2 }}>
                            Communities
                        </TextMalet>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const BalanceSection = memo((({
    balance,
    onOpenModal,
    accountName,
    accountNumber,
    accountCurrency,
    isBalanceHidden,
    onToggleHidden,
    onAddTransaction
}: {
    balance: string,
    onOpenModal: () => void,
    accountName: string,
    accountNumber: string,
    accountCurrency: string,
    isBalanceHidden: boolean,
    onToggleHidden: () => void,
    onAddTransaction: () => void
}) => {
    const maskedAccountNumber = accountNumber.slice(0, 4) + ' ***';
    const displayBalance = isBalanceHidden ? '***.*****' : balance;

    // Animación: shimmer tipo "Pensando..." de la IA (gradiente que barre el texto de izquierda a derecha cada 1.5s)
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const enterAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.timing(enterAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [shimmerAnim, enterAnim]);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-320, 320],
    });

    return (
        <View style={styles.balanceSection}>
            <TouchableOpacity
                onPress={onOpenModal}
                style={styles.accountHeader}
                activeOpacity={0.7}
            >
                <TextMalet style={styles.accountName} numberOfLines={1} ellipsizeMode="tail">
                    {accountName}
                </TextMalet>
                <View style={styles.accountNumberRow}>
                    <TextMalet style={styles.accountNumber}>
                        {maskedAccountNumber}
                    </TextMalet>
                    <IconArrow width={10} height={10} />
                </View>
            </TouchableOpacity>

            <View style={styles.balanceRow}>
                <Animated.View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        opacity: enterAnim,
                        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                    }}
                >
                    <TouchableOpacity onPress={onAddTransaction} style={styles.balanceMain} activeOpacity={0.7}>
                        <View style={styles.balanceShimmerWrap}>
                            <View style={styles.balanceShimmerContent}>
                                <Image source={{ uri: getCurrencyIcon(accountCurrency) }} style={{ width: 24, height: 24 }} />
                                <RollingNumber value={displayBalance} />
                            </View>
                            {/* Shimmer: brillo blanco que barre el bloque (icono + números + USD) */}
                            <Animated.View
                                pointerEvents="none"
                                style={[styles.balanceShimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onToggleHidden} style={styles.eyeButtonInner}>
                        {isBalanceHidden ? (
                            <Feather name="eye-off" size={20} color="#94a3b8" />
                        ) : (
                            <Feather name="eye" size={20} color="#94a3b8" />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}));

export default function Dashboard() {
    const user = useAuthStore(s => s.user);
    const verifySession = useAuthStore(s => s.verifySession);
    const previewTransactions = useWalletStore(s => s.previewTransactions);
    const getPreviewTransactions = useWalletStore(s => s.getPreviewTransactions);
    const error = useWalletStore(s => s.error);
    const loading = useWalletStore(s => s.loading);
    const tasas = useWalletStore(s => s.tasas);
    const getTasas = useWalletStore(s => s.getTasas);
    const selectedAccount = useAccountStore(s => s.selectedAccount);
    const isBalanceHidden = useAccountStore(s => s.isBalanceHidden);
    const toggleBalanceHidden = useAccountStore(s => s.toggleBalanceHidden);
    const getAllAccountsByUserId = useAccountStore(s => s.getAllAccountsByUserId);
    const loadTags = useTagStore(s => s.loadTags);
    const analyticsSummary = useAnalyticsStore(s => s.summary);
    const analyticsLoading = useAnalyticsStore(s => s.loadingSummary);
    const fetchAnalyticsSummary = useAnalyticsStore(s => s.fetchSummary);
    const sharedAccounts = useSharedAccountStore(s => s.sharedAccounts);
    const getSharedAccounts = useSharedAccountStore(s => s.getSharedAccounts);

    const [loadingSession, setLoadingSession] = useState(false);
    const [modalAccountsVisible, setModalAccountsVisible] = useState(false);
    // Index for carousel of tasas
    const [currentTasaIndex, setCurrentTasaIndex] = useState(0);
    // Track if analytics has been fetched at least once
    const [analyticsFetched, setAnalyticsFetched] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoFadeAnim = useRef(new Animated.Value(0)).current;
    const modalAccountsRef = useRef<ModalAccountsRef>(null);
    // Animated value for fading tasa text on change
    const fadeTasaAnim = useRef(new Animated.Value(1)).current;
    // Slide animation for tasa card
    const slideTasaAnim = useRef(new Animated.Value(0)).current;
    // Low-speed background animation for the rates card
    const tasaBgAnim = useRef(new Animated.Value(0)).current;
    // Sticky header opacity
    const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;

    const startAnimation = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(logoFadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoFadeAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();

    }, [fadeAnim, logoFadeAnim]);

    const verifyUserSession = useCallback(async () => {
        setLoadingSession(true);
        startAnimation();
        const isAuthenticated = await verifySession();
        if (!isAuthenticated) {
            router.replace('/');
        }
        setLoadingSession(false);
    }, [verifySession, startAnimation]);

    const loadTransactions = useCallback(async () => {
        if (user?.id) {
            await getPreviewTransactions(selectedAccount?.id || '', user.id);
        }
    }, [user?.id, selectedAccount?.id, getPreviewTransactions]);

    // -- GET VENEZUELAN TASAS
    // Using a useCallback to prevent unnecessary re-renders
    // and to ensure that the function is only created once
    // brd-task-4857390986324342
    const loadTasas = useCallback(async () => {
        await getTasas();
    }, [getTasas]);


    const handleOpenModal = useCallback(() => {
        setModalAccountsVisible(true);
    }, []);

    const handleCloseModalAccounts = useCallback(() => {
        setModalAccountsVisible(false);
    }, []);

    const handleRefresh = useCallback(() => {
        loadTransactions();
    }, [loadTransactions]);

    const handleViewAllTransactions = useCallback(() => {
        router.push('/wallet/transactions/getAllTransaction');
    }, []);

    const formattedBalance = useMemo(() => {
        return selectedAccount
            ? `${selectedAccount.balance.toFixed(2)} ${selectedAccount.currency}`
            : 'General';
    }, [selectedAccount?.balance, selectedAccount?.currency]);

    useEffect(() => {
        // verifyUserSession();

        return () => {
            fadeAnim.setValue(0);
            logoFadeAnim.setValue(0);
        };
    }, [verifyUserSession, fadeAnim, logoFadeAnim]);

    useEffect(() => {
        loadTransactions();
        loadTasas();
        getSharedAccounts();
    }, [loadTransactions, loadTasas, getSharedAccounts]);

    useEffect(() => {
        if (!selectedAccount?.id) return;
        setAnalyticsFetched(false);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        useAnalyticsStore.setState({ summary: null, loadingSummary: true });
        fetchAnalyticsSummary({
            account_id: selectedAccount.id,
            from: monthStart,
            to: monthEnd,
        }).then(() => {
            setAnalyticsFetched(true);
        });
    }, [selectedAccount?.id, fetchAnalyticsSummary]);

    useEffect(() => {
        const sync = async () => {
            useToastStore.getState().add({
                type: 'info',
                message: 'Sincronizando datos...',
                duration: 2000,
            });
            await Promise.allSettled([
                getAllAccountsByUserId({ refresh: true }),
                loadTags(),
            ]);
        };
        sync();
    }, [getAllAccountsByUserId, loadTags]);

    // Carousel effect: change displayed tasa every 10 seconds
    useEffect(() => {
        if (!tasas || tasas.length === 0) return;
        const interval = setInterval(() => {
            setCurrentTasaIndex(prev => (prev + 1) % tasas.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [tasas]);

    // Slide animation when the displayed tasa changes
    useEffect(() => {
        slideTasaAnim.setValue(0);
        Animated.spring(slideTasaAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [currentTasaIndex]);

    useEffect(() => {
        Animated.loop(
            Animated.timing(tasaBgAnim, {
                toValue: 1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [tasaBgAnim]);

    const tasaBgTranslate = tasaBgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -30],
    });

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error]);

    const HEADER_SHOW_THRESHOLD = 80;
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    const handleScroll = useCallback((e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const shouldShow = y > HEADER_SHOW_THRESHOLD;
        setShowStickyHeader(shouldShow);
        stickyHeaderOpacity.setValue(y);
    }, []);

    if (loadingSession) {
        return <LoadingScreen fadeAnim={fadeAnim} logoFadeAnim={logoFadeAnim} />;
    }

    const stickyOpacity = stickyHeaderOpacity.interpolate({
        inputRange: [HEADER_SHOW_THRESHOLD - 10, HEADER_SHOW_THRESHOLD + 10],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Sticky header with blur - appears on scroll */}
            <Animated.View style={[styles.stickyHeaderOverlay, { opacity: stickyOpacity }]} pointerEvents={showStickyHeader ? 'auto' : 'none'}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
                <BlurView intensity={80} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
                <SafeAreaView style={{ flex: 0, backgroundColor: 'transparent' }}>
                    <View style={styles.stickyHeaderContent}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
                                <TextMalet style={{ fontSize: 15, fontWeight: '600', color: 'rgba(0,0,0,0.85)' }} numberOfLines={1} ellipsizeMode="tail">
                                    {user?.name || ''}
                                </TextMalet>
                                {user?.verified && user.verification_type && (
                                    <IconVerified width={18} height={18} fill={VERIFICATION_TYPES[user.verification_type.type]?.color || '#6366f1'} />
                                )}
                            </View>
                            <TextMalet style={{ color: 'rgba(116, 116, 116, 1)', fontSize: 13, marginTop: 1 }}>
                                @{user?.username || ''}
                            </TextMalet>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/profile')}>
                            <Image
                                source={user?.avatar_url ? { uri: user.avatar_url } : require('@/assets/images/placeholders/placeholder_avatar.png')}
                                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f0f0' }}
                            />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Spacer for status bar */}
                <View style={{ height: 16 }} />

                {/* Original header - visible at top, hidden when scrolling */}
                <DashboardHeader name={user?.name || ''} userAvatar={user?.avatar_url} userBanner={user?.banner_url} username={user.username} />

                <BalanceSection
                    balance={formattedBalance}
                    onOpenModal={handleOpenModal}
                    accountName={selectedAccount?.name || 'General'}
                    accountNumber={selectedAccount?.id || '0000'}
                    accountCurrency={selectedAccount?.currency || 'USD'}
                    isBalanceHidden={isBalanceHidden}
                    onToggleHidden={toggleBalanceHidden}
                    onAddTransaction={() => router.push('/wallet/add')}
                />

                {/* Tasas de Cambio Section */}
                <View style={styles.tasasContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                        <Layers size={15} color="#222222ff" />
                        <TextMalet style={styles.tasasHeader}>Malet | Suite</TextMalet>
                    </View>

                    <View>
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                        >
                            {/* BCV Rate Card with premium style */}
                            <View style={{ width: 170, height: TICKET_H + 8 }}>
                                <LinearGradient
                                    colors={['#ffffff', '#fcfcfcff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.tasaCard, { overflow: 'hidden', height: TICKET_H }]}
                                >
                                {/* Animated background texture */}
                                <Animated.View style={[StyleSheet.absoluteFill, {
                                    opacity: 0.15,
                                    transform: [{ translateX: tasaBgTranslate }]
                                }]}>
                                    <Svg width="250%" height="100%">
                                        <Defs>
                                            <Pattern id="dotsPattern" width="15" height="15" patternUnits="userSpaceOnUse">
                                                <Circle cx="2" cy="2" r="1" fill="#141414ff" />
                                            </Pattern>
                                        </Defs>
                                        <Rect width="100%" height="100%" fill="url(#dotsPattern)" />
                                    </Svg>
                                </Animated.View>

                                {/* Fade mask for the texture */}
                                <LinearGradient
                                    colors={['rgba(255,255,255,1)', 'rgba(39, 39, 39, 0.02)', 'rgba(255,255,255,0.8)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />

                                <Animated.View style={{ opacity: fadeTasaAnim, flex: 1, justifyContent: 'space-between', zIndex: 1 }}>
                                    {tasas && tasas.length > 0 ? (
                                        <>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <TrendingUp size={14} color="#64748b" />
                                                <TextMalet style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>
                                                    Tasa {tasas[currentTasaIndex]?.nombre}
                                                </TextMalet>
                                            </View>

                                            <View>
                                                <TextMalet style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 1 }}>
                                                    Bs {tasas[currentTasaIndex]?.promedio?.toFixed(2)}
                                                </TextMalet>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <TextMalet style={{ color: '#94a3b8', fontSize: 10 }}>
                                                        1 USD • {parseDate(tasas[currentTasaIndex]?.fechaActualizacion).split(',')[0]}
                                                    </TextMalet>
                                                </View>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color="#6366f1" />
                                        </View>
                                    )}
                                </Animated.View>
                            </LinearGradient>
                            </View>

                            <TouchableOpacity onPress={() => router.push('/calculator' as any)} style={{ width: 170, height: TICKET_H + 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                                <View style={{ width: '100%', height: TICKET_H, borderRadius: 10, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#d8d8e0', padding: 14, justifyContent: 'center', overflow: 'hidden' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
                                        <IconAt width={18} height={18} fill="#64748b" />
                                        <View>
                                            <TextMalet style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', letterSpacing: -0.2 }}>
                                                Calculadora
                                            </TextMalet>
                                            <TextMalet style={{ fontSize: 9, color: '#8888a0', fontWeight: '400', marginTop: 1 }}>
                                                Conversor
                                            </TextMalet>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/s-accounts/main')} style={{ width: 170, height: TICKET_H + 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                                <View style={{ width: '100%', height: TICKET_H, borderRadius: 10, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#d8d8e0', padding: 14, justifyContent: 'center', overflow: 'hidden' }}>
                                    {/* Hex pattern texture */}
                                    <View style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}>
                                        <Svg width="100%" height="100%">
                                            <Defs>
                                                <Pattern id="sHexPattern" width="14" height="24" patternUnits="userSpaceOnUse">
                                                    <Path d="M7 0L14 4.2V12.6L7 16.8L0 12.6V4.2Z" fill="none" stroke="#1a1a2e" strokeWidth="0.8" />
                                                </Pattern>
                                            </Defs>
                                            <Rect width="100%" height="100%" fill="url(#sHexPattern)" />
                                        </Svg>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
                                        <Wallet size={18} color={'#1a1a2e'} fill={'#f5f4fa'} />
                                        <View>
                                            <TextMalet style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', letterSpacing: -0.2 }}>
                                                S-Accounts
                                            </TextMalet>
                                            <TextMalet style={{ fontSize: 9, color: '#8888a0', fontWeight: '400', marginTop: 1 }}>
                                                Shared
                                            </TextMalet>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/analytics')} style={{ width: 170, height: TICKET_H + 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                                <View style={{ width: '100%', height: TICKET_H, borderRadius: 10, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#d8d8e0', padding: 14, justifyContent: 'center', overflow: 'hidden' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
                                        <TrendingUp size={18} color="#1e88e5" />
                                        <View>
                                            <TextMalet style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', letterSpacing: -0.2 }}>
                                                Analíticas
                                            </TextMalet>
                                            <TextMalet style={{ fontSize: 9, color: '#8888a0', fontWeight: '400', marginTop: 1 }}>
                                                Stats
                                            </TextMalet>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <GoldenTicket onPress={() => router.push('/communities' as any)} />

                        </ScrollView>
                    </View>
                </View>

                {/* Transacciones recientes. */}

                <View style={styles.transactionsContainer}>
                    <View style={styles.transactionsList}>
                        {previewTransactions.length > 0 ? (
                            previewTransactions.slice(0, 3).map((item) => (
                                <LastTransactions key={item.id.toString()} item={item} />
                            ))
                        ) : (
                            !loading && (
                                <View style={styles.emptyContainer}>
                                    <TextMalet style={styles.emptyListText}>
                                        No hay movimientos aún.
                                    </TextMalet>
                                    <TouchableOpacity
                                        style={styles.emptyCta}
                                        onPress={() => router.push('/wallet/add?type=expense')}
                                        activeOpacity={0.7}
                                    >
                                        <Plus size={14} color="#fff" />
                                        <TextMalet style={styles.emptyCtaText}>Crear movimiento</TextMalet>
                                    </TouchableOpacity>
                                </View>
                            )
                        )}
                    </View>

                    {previewTransactions.length > 0 && (
                        <View style={styles.viewAllWrapper}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.viewAllGradient}
                            />
                            <TouchableOpacity onPress={handleViewAllTransactions} style={styles.viewAllChip}>
                                <TextMalet style={styles.viewAllChipText}>Ver todas</TextMalet>
                                <ArrowRight size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Analytics Widget */}
                <TouchableOpacity
                    onPress={() => router.push('/analytics')}
                    activeOpacity={0.7}
                    style={styles.analyticsWidget}
                >
                    <View style={styles.analyticsWidgetHeader}>
                        <View style={styles.analyticsWidgetTitleRow}>
                            <TrendingUp size={14} color="rgba(0,0,0,0.55)" />
                            <TextMalet style={styles.analyticsWidgetTitle}>Resumen mensual</TextMalet>
                        </View>
                        <ArrowRight size={14} color="rgba(0,0,0,0.3)" />
                    </View>

                    {!analyticsFetched ? (
                        <View style={styles.analyticsWidgetMetrics}>
                            <View style={styles.analyticsMetric}>
                                <View style={styles.skeletonMiniLabel} />
                                <View style={styles.skeletonMiniValue} />
                            </View>
                            <View style={styles.analyticsDivider} />
                            <View style={styles.analyticsMetric}>
                                <View style={styles.skeletonMiniLabel} />
                                <View style={styles.skeletonMiniValue} />
                            </View>
                        </View>
                    ) : analyticsSummary ? (
                        <>
                            <View style={styles.analyticsWidgetMetrics}>
                                <View style={styles.analyticsMetric}>
                                    <TextMalet style={[styles.analyticsMetricLabel, { color: '#ef4444' }]}>Egreso</TextMalet>
                                    <TextMalet style={[styles.analyticsMetricValue, { color: '#ef4444' }]}>
                                        ${analyticsSummary.total_spent.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TextMalet>
                                </View>
                                <View style={styles.analyticsDivider} />
                                <View style={styles.analyticsMetric}>
                                    <TextMalet style={[styles.analyticsMetricLabel, { color: '#22c55e' }]}>Ingreso</TextMalet>
                                    <TextMalet style={[styles.analyticsMetricValue, { color: '#22c55e' }]}>
                                        ${analyticsSummary.total_saved.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TextMalet>
                                </View>
                            </View>

                            {analyticsSummary.by_type.length > 0 && (
                                <View style={styles.analyticsTypeBar}>
                                    {analyticsSummary.by_type.map((t, i) => {
                                        const total = analyticsSummary.total_spent + analyticsSummary.total_saved;
                                        const pct = total > 0 ? (t.total / total) * 100 : 0;
                                        if (pct <= 0) return null;
                                        const isFirst = i === 0;
                                        const isLast = i === analyticsSummary.by_type.length - 1;

                                        let barColors: [string, string];
                                        if (t.type === 'saving') {
                                            barColors = ['#86efac', '#22c55e'];
                                        } else if (t.type === 'pending_payment') {
                                            barColors = ['#fde68a', '#f59e0b'];
                                        } else {
                                            barColors = ['#fca5a5', '#ef4444'];
                                        }

                                        return (
                                            <LinearGradient
                                                key={t.type}
                                                colors={barColors}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    styles.analyticsTypeSegment,
                                                    { flex: pct },
                                                    isFirst && isLast && { borderRadius: 10 },
                                                    isFirst && !isLast && { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
                                                    !isFirst && isLast && { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.analyticsWidgetMetrics}>
                            <View style={styles.analyticsMetric}>
                                <TextMalet style={styles.analyticsMetricLabel}>Sin datos este mes</TextMalet>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shoppingEntry}
                    onPress={() => router.push('/shopping-list' as any)}
                    activeOpacity={0.7}
                >
                    <View style={styles.shoppingEntryLeft}>
                        <View style={styles.shoppingEntryIcon}>
                            <ShoppingCart size={18} color="#000" />
                        </View>
                        <View>
                            <TextMalet style={styles.shoppingEntryTitle}>Lista de Compras</TextMalet>
                            <TextMalet style={styles.shoppingEntrySubtitle}>Organiza tus compras</TextMalet>
                        </View>
                    </View>
                    <ArrowRight size={16} color="rgba(0,0,0,0.38)" />
                </TouchableOpacity>

                {/* S-Accounts Widget */}
                {sharedAccounts.length > 0 && (
                    <TouchableOpacity
                        onPress={() => router.push('/s-accounts/main')}
                        activeOpacity={0.7}
                        style={styles.sAccountsWidget}
                    >
                        <View style={styles.sAccountsWidgetHeader}>
                            <View style={styles.sAccountsWidgetTitleRow}>
                                <Wallet size={14} color="rgba(0,0,0,0.55)" />
                                <TextMalet style={styles.sAccountsWidgetTitle}>S-Accounts</TextMalet>
                                <View style={styles.sAccountsBadge}>
                                    <TextMalet style={styles.sAccountsBadgeText}>{sharedAccounts.length}</TextMalet>
                                </View>
                            </View>
                            <ArrowRight size={14} color="rgba(0,0,0,0.3)" />
                        </View>

                        <View style={styles.sAccountsList}>
                            {sharedAccounts.slice(0, 3).map((account) => (
                                <View key={account.id} style={styles.sAccountRow}>
                                    <View style={styles.sAccountAvatar}>
                                        <TextMalet style={styles.sAccountInitial}>
                                            {account.name.charAt(0).toUpperCase()}
                                        </TextMalet>
                                    </View>
                                    <View style={styles.sAccountInfo}>
                                        <TextMalet style={styles.sAccountName} numberOfLines={1}>
                                            {account.name}
                                        </TextMalet>
                                        <TextMalet style={styles.sAccountId} numberOfLines={1}>
                                            {account.identification_number}
                                        </TextMalet>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {sharedAccounts.length > 3 && (
                            <TextMalet style={styles.sAccountsMore}>
                                +{sharedAccounts.length - 3} más
                            </TextMalet>
                        )}
                    </TouchableOpacity>
                )}

                {/* Tasas Widget */}
                {tasas && tasas.length > 0 && (
                    <View style={styles.tasasWidget}>
                        <View style={styles.tasasWidgetHeader}>
                            <View style={styles.tasasWidgetTitleRow}>
                                <Layers size={14} color="rgba(0,0,0,0.55)" />
                                <TextMalet style={styles.tasasWidgetTitle}>Tasas de Cambio</TextMalet>
                            </View>
                            <View style={styles.tasasWidgetDots}>
                                {tasas.map((_, i) => (
                                    <Animated.View
                                        key={i}
                                        style={[
                                            styles.tasasDot,
                                            i === currentTasaIndex && styles.tasasDotActive,
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>

                        <Animated.View style={{
                            opacity: slideTasaAnim,
                            transform: [{
                                translateX: slideTasaAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0],
                                }),
                            }],
                        }}>
                            <View style={styles.tasasWidgetContent}>
                                <View style={styles.tasasWidgetItem}>
                                    <View style={styles.tasasWidgetItemHeader}>
                                        <TextMalet style={styles.tasasWidgetItemName}>
                                            {tasas[currentTasaIndex]?.nombre}
                                        </TextMalet>
                                        <View style={styles.tasasWidgetActiveBadge}>
                                            <TextMalet style={styles.tasasWidgetActiveBadgeText}>●</TextMalet>
                                        </View>
                                    </View>

                                    <View style={styles.tasasWidgetItemPrices}>
                                        <View style={styles.tasasWidgetItemPrice}>
                                            <TextMalet style={styles.tasasWidgetItemPriceLabel}>Compra</TextMalet>
                                            <TextMalet style={styles.tasasWidgetItemPriceValue}>
                                                {tasas[currentTasaIndex]?.compra != null ? `Bs ${tasas[currentTasaIndex].compra.toFixed(2)}` : '—'}
                                            </TextMalet>
                                        </View>
                                        <View style={styles.tasasWidgetItemDivider} />
                                        <View style={styles.tasasWidgetItemPrice}>
                                            <TextMalet style={styles.tasasWidgetItemPriceLabel}>Venta</TextMalet>
                                            <TextMalet style={styles.tasasWidgetItemPriceValueHighlight}>
                                                {tasas[currentTasaIndex]?.venta != null ? `Bs ${tasas[currentTasaIndex].venta.toFixed(2)}` : '—'}
                                            </TextMalet>
                                        </View>
                                    </View>

                                    <TextMalet style={styles.tasasWidgetItemUpdated}>
                                        {parseDate(tasas[currentTasaIndex]?.fechaActualizacion).split(',')[0]}
                                    </TextMalet>
                                </View>
                            </View>
                        </Animated.View>

                        <View style={styles.tasasWidgetFooter}>
                            <TextMalet style={styles.tasasWidgetFooterText}>
                                1 USD = Bs {tasas[currentTasaIndex]?.promedio?.toFixed(2) || '—'}
                            </TextMalet>
                        </View>
                    </View>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity onPress={() => router.push('/wallet/add?type=expense')} style={styles.fab}>
                <Plus size={24} color="#fff" />
            </TouchableOpacity>

            <ModalAccounts visible={modalAccountsVisible} onClose={handleCloseModalAccounts} />
            <UpdatesModal />
        </View>
    );
};

const styles = StyleSheet.create({
    // ---- Tasas styles ----
    tasasContainer: {
    },
    tasasHeader: {
        fontSize: 14,
        fontWeight: '600',
    },
    newBadge: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        marginLeft: 2,
    },
    newBadgeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    // Card style for BCV rate with subtle gradient and shadow
    tasaCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#f5f5f5',
        width: 170,
    },
    tasaItem: {
        backgroundColor: 'rgb(245, 245, 245)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    tasaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
    },
    tasaValue: {
        fontSize: 14,
        color: '#555',
    },
    tasaDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    container: {
        flex: 1,
        paddingTop: 0,
        padding: 12,
        paddingBottom: 0
    },
    stickyHeaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    scrollContent: {
        padding: 12,
        gap: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerScroll: {
        flex: 1,
        alignItems: 'center',
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    headerText: {
        fontSize: 15,
    },
    balanceSection: {
        marginTop: 10,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    balanceContainer: {
        flex: 1,
        gap: 6,
    },
    accountHeader: {
        alignItems: 'center',
        gap: 2,
    },
    accountName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(60, 60, 60, 1)',
        textAlign: 'center',
    },
    accountNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    accountNumber: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(120, 120, 120, 0.8)',
        letterSpacing: 0.5,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    balanceShimmerWrap: {
        overflow: 'hidden',
        position: 'relative',
    },
    balanceShimmerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    balanceShimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 180,
    },
    balanceMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    balanceValue: {
        fontSize: DIGIT_H,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    eyeButtonInner: {
        padding: 4,
    },
    summaryBox: {
        gap: 5,
        backgroundColor: 'rgb(245, 245, 245)',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
    },
    summaryText: {
        fontSize: 15,
    },
    transactionsContainer: {
        position: 'relative',
        minHeight: 210,
    },
    transactionsList: {
        gap: 2,
    },
    viewAllWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 12,
    },
    viewAllGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    viewAllChip: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    viewAllChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    listHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        minHeight: 170,
    },
    emptyListText: {
        textAlign: 'center',
        fontSize: 14,
        color: 'rgba(0,0,0,0.38)',
        marginBottom: 16,
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
    },
    emptyCtaText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    shoppingEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 0,
        marginTop: 4,
        marginBottom: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8e8ec',
        backgroundColor: '#fff',
        minHeight: 72,
    },
    shoppingEntryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shoppingEntryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d0d0d8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shoppingEntryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    shoppingEntrySubtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.38)',
        marginTop: 1,
    },
    analyticsWidget: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        minHeight: 110,
        justifyContent: 'center',
    },
    analyticsWidgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analyticsWidgetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    analyticsWidgetTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    analyticsWidgetMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    analyticsMetric: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    analyticsMetricLabel: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.4)',
        fontWeight: '500',
    },
    analyticsMetricValue: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.8)',
        marginLeft: 'auto',
    },
    analyticsDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginHorizontal: 10,
    },
    analyticsTypeBar: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 14,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    analyticsTypeSegment: {
        height: '100%',
    },
    skeletonMiniLabel: {
        width: 50,
        height: 10,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    skeletonMiniValue: {
        width: 70,
        height: 13,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginLeft: 'auto',
    },
    sAccountsWidget: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    sAccountsWidgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sAccountsWidgetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sAccountsWidgetTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    sAccountsBadge: {
        backgroundColor: 'rgba(0,0,0,0.07)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sAccountsBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
    sAccountsList: {
        gap: 10,
    },
    sAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sAccountAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sAccountInitial: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
    },
    sAccountInfo: {
        flex: 1,
        gap: 1,
    },
    sAccountName: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.8)',
    },
    sAccountId: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.35)',
    },
    sAccountsMore: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.35)',
        marginTop: 10,
        textAlign: 'center',
    },
    tasasWidget: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    tasasWidgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    tasasWidgetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tasasWidgetTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.85)',
    },
    tasasWidgetDots: {
        flexDirection: 'row',
        gap: 5,
    },
    tasasDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    tasasDotActive: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 18,
    },
    tasasWidgetContent: {
        marginBottom: 12,
    },
    tasasWidgetItem: {
        backgroundColor: 'rgba(0,0,0,0.025)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    tasasWidgetItemActive: {
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderColor: 'rgba(0,0,0,0.08)',
    },
    tasasWidgetItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tasasWidgetItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.7)',
        flex: 1,
    },
    tasasWidgetActiveBadge: {
        marginLeft: 4,
    },
    tasasWidgetActiveBadgeText: {
        fontSize: 8,
        color: '#1a1a1a',
    },
    tasasWidgetItemPrices: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    tasasWidgetItemPrice: {
        flex: 1,
    },
    tasasWidgetItemPriceLabel: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        fontWeight: '500',
        marginBottom: 3,
    },
    tasasWidgetItemPriceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.85)',
        letterSpacing: -0.3,
    },
    tasasWidgetItemPriceValueHighlight: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.3,
    },
    tasasWidgetItemDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    tasasWidgetItemUpdated: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.3)',
    },
    tasasWidgetFooter: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    tasasWidgetFooterText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
});