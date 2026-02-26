import Button from "@/components/Button/Button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LastTransactions from "@/components/dashboard/LastTransactions";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import UpdatesModal from "@/components/Modals/UpdatesModal/UpdatesModal";
import TextMalet from "@/components/TextMalet/TextMalet";
import { parseDate } from "@/shared/services/date/parseDate";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconArrow from "@/svgs/dashboard/IconArrow";
import IconAt from "@/svgs/dashboard/IconAt";
import IconCommunities from "@/svgs/dashboard/IconCommunities";
import IconMinus from "@/svgs/dashboard/IconMinus";
import IconPlus from "@/svgs/dashboard/IconPlus";
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

// lucide icon 
import { AtSign, Layers, TrendingUp, Wallet } from 'lucide-react-native';

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
        ...StyleSheet.absoluteFillObject,
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

const BalanceSection = memo((({
    balance,
    onOpenModal,
    accountName,
    accountNumber,
    isBalanceHidden,
    onToggleHidden
}: {
    balance: string,
    onOpenModal: () => void,
    accountName: string,
    accountNumber: string,
    isBalanceHidden: boolean,
    onToggleHidden: () => void
}) => {
    const maskedAccountNumber = accountNumber.slice(0, 4) + ' ***';
    const displayBalance = isBalanceHidden ? '***.*****' : balance;

    return (
        <View style={styles.balanceSection}>
            <View style={styles.balanceContainer}>
                {/* Account info outside the card */}
                <TouchableOpacity
                    onPress={onOpenModal}
                    style={styles.accountHeader}
                >
                    <View style={styles.accountInfo}>
                        <TextMalet style={styles.accountName} numberOfLines={1} ellipsizeMode="tail">
                            {accountName}
                        </TextMalet>
                        <TextMalet style={styles.accountNumber}>
                            {maskedAccountNumber}
                        </TextMalet>
                    </View>
                    <IconArrow width={12} height={12} />
                </TouchableOpacity>

                <Pressable onPress={onOpenModal}>
                    <View style={styles.balanceCard}>
                        <TouchableOpacity onPress={onOpenModal} style={{ flexShrink: 1 }}>
                            <TextMalet style={styles.balanceValue} numberOfLines={1}>{displayBalance}</TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onToggleHidden} style={styles.eyeButtonInner}>
                            {isBalanceHidden ? (
                                <Feather name="eye-off" size={20} color="#666" />
                            ) : (
                                <Feather name="eye" size={20} color="#666" />
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </View>
            <View style={styles.actionsContainer}>
                <Link push href='/wallet/add?type=expense'>
                    <IconMinus width={40} height={40} fill={'rgb(255, 114, 114)'} />
                </Link>
                <Link push href='/wallet/add?type=saving'>
                    <IconPlus width={45} height={45} fill={'rgb(38, 219, 93)'} />
                </Link>
            </View>
        </View>
    );
}));

export default function Dashboard() {
    const { user, verifySession } = useAuthStore();
    const { previewTransactions, getPreviewTransactions, error, loading, tasas, getTasas } = useWalletStore();
    const { selectedAccount, isBalanceHidden, toggleBalanceHidden } = useAccountStore();

    const [loadingSession, setLoadingSession] = useState(false);
    const [modalAccountsVisible, setModalAccountsVisible] = useState(false);
    // Index for carousel of tasas
    const [currentTasaIndex, setCurrentTasaIndex] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoFadeAnim = useRef(new Animated.Value(0)).current;
    const modalAccountsRef = useRef<ModalAccountsRef>(null);
    // Animated value for fading tasa text on change
    const fadeTasaAnim = useRef(new Animated.Value(1)).current;
    // Low-speed background animation for the rates card
    const tasaBgAnim = useRef(new Animated.Value(0)).current;

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
    }, [selectedAccount]);

    useEffect(() => {
        verifyUserSession();

        return () => {
            fadeAnim.setValue(0);
            logoFadeAnim.setValue(0);
        };
    }, [verifyUserSession, fadeAnim, logoFadeAnim]);

    useEffect(() => {
        loadTransactions();
        loadTasas();
        console.log(tasas);
    }, [loadTransactions, loadTasas]);

    // Carousel effect: change displayed tasa every 10 seconds
    useEffect(() => {
        if (!tasas || tasas.length === 0) return;
        const interval = setInterval(() => {
            setCurrentTasaIndex(prev => (prev + 1) % tasas.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [tasas]);

    // Fade animation when the displayed tasa changes
    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeTasaAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeTasaAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
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

    if (loadingSession) {
        return <LoadingScreen fadeAnim={fadeAnim} logoFadeAnim={logoFadeAnim} />;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <DashboardHeader name={user?.name || ''} userAvatar={user?.avatar_url} userBanner={user?.banner_url} username={user.username} />

                <BalanceSection
                    balance={formattedBalance}
                    onOpenModal={handleOpenModal}
                    accountName={selectedAccount?.name || 'General'}
                    accountNumber={selectedAccount?.id || '0000'}
                    isBalanceHidden={isBalanceHidden}
                    onToggleHidden={toggleBalanceHidden}
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
                            <LinearGradient
                                colors={['#ffffff', '#fcfcfcff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.tasaCard, { overflow: 'hidden' }]}
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
                                                    Bs {tasas[currentTasaIndex]?.promedio}
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

                            <TouchableOpacity onPress={() => router.push('/s-accounts/main')} style={{ width: 170 }}>
                                <LinearGradient
                                    colors={['#ffffff', '#e1d7ffff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 10, borderRadius: 10, width: '100%', gap: 8, borderWidth: 1, borderColor: '#f5f5f5', overflow: 'hidden' }}>

                                    <View style={[StyleSheet.absoluteFill, { opacity: 0.1, zIndex: 0 }]}>
                                        <Svg width="100%" height="100%">
                                            <Defs>
                                                <Pattern id="gridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                                                    <Path d="M 16 0 L 0 0 0 16" fill="none" stroke="#252525" strokeWidth="1" />
                                                </Pattern>
                                            </Defs>
                                            <Rect width="100%" height="100%" fill="url(#gridPattern)" />
                                        </Svg>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 1 }}>
                                        <Wallet size={15} color={'#505050ff'} fill={'#ecececff'} />
                                        <TextMalet style={{ fontWeight: '500' }}>S-Accounts</TextMalet>
                                        {SHOW_S_ACCOUNTS_NEW_TAG && (
                                            <View style={styles.newBadge}>
                                                <TextMalet style={styles.newBadgeText}>NEW</TextMalet>
                                            </View>
                                        )}
                                    </View>

                                    <View style={{ zIndex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <AtSign size={15} color={'#505050ff'} />
                                            <TextMalet style={{ fontSize: 11 }}>Get Started with</TextMalet>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <TextMalet style={{ fontSize: 11 }}>M-Account</TextMalet>
                                        </View>
                                    </View>

                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/communities' as any)} style={{ width: 170 }}>
                                <LinearGradient
                                    colors={['#ffffff', '#ffffffff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 10, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: '#f5f5f5', paddingBottom: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <IconCommunities width={18} height={18} fill={'#1f1f1fff'} />
                                        <TextMalet>Comunidades</TextMalet>
                                    </View>

                                    <View>
                                        <View style={{ flexDirection: 'row', gap: 2 }}>
                                            <View style={{ width: 18, height: 22, backgroundColor: '#d1d1d1ff', borderRadius: 5 }}></View>
                                            <View style={{ width: 13, height: 22, backgroundColor: '#d6d7fdff', borderRadius: 5 }}></View>
                                            <View style={{ width: 25, height: 22, backgroundColor: '#fcdfabff', borderRadius: 5 }}></View>
                                            <View style={{ width: 20, height: 22, backgroundColor: '#fdb3aeff', borderRadius: 5 }}></View>
                                            <View style={{ width: 15, height: 22, backgroundColor: '#bcffd8ff', borderRadius: 5 }}></View>
                                            <View style={{ width: 15, height: 22, backgroundColor: '#f7b9ffff', borderRadius: 5 }}></View>
                                            <View style={{ width: 18, height: 22, backgroundColor: '#b1dafcff', borderRadius: 5 }}></View>
                                        </View>
                                    </View>

                                </LinearGradient>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>

                {/* Transacciones recientes. */}
                {/* Turn into a separated component brd-task-1526845236958456 */}

                <FlatList
                    data={previewTransactions}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    style={styles.transactionsList}
                    ListHeaderComponent={
                        <TextMalet style={styles.listHeader}>
                            Transacciones recientes
                        </TextMalet>
                    }
                    renderItem={({ item }) => <LastTransactions item={item} />}
                    ListEmptyComponent={
                        <TextMalet style={styles.emptyListText}>
                            No hay transacciones recientes.
                        </TextMalet>
                    }
                    onRefresh={handleRefresh}
                    refreshing={loading && previewTransactions.length === 0}
                />

            </View>

            <View style={styles.viewAllTransactions}>
                <Button text="Ver todas las transacciones" onPress={handleViewAllTransactions}
                    style={{ width: '100%' }}
                />
            </View>

            <ModalAccounts visible={modalAccountsVisible} onClose={handleCloseModalAccounts} />
            <UpdatesModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    viewAllButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ---- Tasas styles ----
    tasasContainer: {
        marginTop: 8,
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
    viewAllButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
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
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    balanceContainer: {
        flex: 1,
        gap: 6,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        width: '100%',
    },
    accountInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    accountName: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(60, 60, 60, 1)',
        flexShrink: 1,
    },
    accountNumber: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(120, 120, 120, 0.8)',
        letterSpacing: 0.5,
    },
    balanceCard: {
        backgroundColor: 'rgb(250, 250, 250)',
        borderRadius: 10,
        padding: 8,
        width: '100%',
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        alignSelf: 'flex-start',
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a', // Rich dark color
        letterSpacing: -0.5,
    },
    eyeButtonInner: {
        padding: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
    transactionsList: {
        flex: 1,
        marginTop: 9,
        flexGrow: 1,
    },
    listHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    viewAllTransactions: {
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        width: '100%',
    }
});