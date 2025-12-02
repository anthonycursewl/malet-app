import Button from "@/components/Button/Button";
import LastTransactions from "@/components/dashboard/LastTransactions";
import DashboardHeader from "@/components/DashboardHeader";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
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
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ModalAccountsRef {
    openModal: () => void;
}

const LoadingScreen = memo(({ fadeAnim, logoFadeAnim }: { fadeAnim: Animated.Value, logoFadeAnim: Animated.Value }) => (
    <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Animated.View style={{ opacity: logoFadeAnim }}>
            <IconAt width={100} height={100} />
        </Animated.View>
        <TextMalet style={{ marginTop: 20 }}>Verificando sesión...</TextMalet>
        <ActivityIndicator
            size="small"
            color={'rgb(10, 10, 10)'}
            style={{ marginTop: 20 }}
        />
    </Animated.View>
));

const BalanceSection = memo((({
    balance,
    onOpenModal,
    accountName,
    accountNumber
}: {
    balance: string,
    onOpenModal: () => void,
    accountName: string,
    accountNumber: string
}) => {
    const maskedAccountNumber = accountNumber.slice(0, 4) + ' ***';

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

                <TouchableOpacity onPress={onOpenModal}>
                    <View style={styles.balanceCard}>
                        <TextMalet style={styles.balanceValue} numberOfLines={1}>{balance}</TextMalet>
                    </View>
                </TouchableOpacity>
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
    const { selectedAccount } = useAccountStore();

    const [loadingSession, setLoadingSession] = useState(false);
    const [modalAccountsVisible, setModalAccountsVisible] = useState(false);
    // Index for carousel of tasas
    const [currentTasaIndex, setCurrentTasaIndex] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoFadeAnim = useRef(new Animated.Value(0)).current;
    const modalAccountsRef = useRef<ModalAccountsRef>(null);
    // Animated value for fading tasa text on change
    const fadeTasaAnim = useRef(new Animated.Value(1)).current;

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
                />

                {/* Tasas de Cambio Section */}
                <View style={styles.tasasContainer}>
                    <TextMalet style={styles.tasasHeader}>Tasas de Cambio</TextMalet>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* BCV Rate Card with enhanced style */}
                        <LinearGradient
                            colors={['#f0f0f059', '#eeeeeead']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.5, y: 0 }}
                            style={styles.tasaCard}
                        >
                            <Animated.View style={{ opacity: fadeTasaAnim }}>
                                {tasas && tasas.length > 0 ? (
                                    <>
                                        <TextMalet style={{ marginBottom: 2, fontWeight: '600' }}>
                                            Tasa {tasas[currentTasaIndex]?.nombre}
                                        </TextMalet>
                                        <TextMalet style={{ fontSize: 13 }}>
                                            1 USD = Bs {tasas[currentTasaIndex]?.promedio}
                                        </TextMalet>
                                        <TextMalet style={{ color: '#555', fontSize: 12 }}>
                                            {parseDate(tasas[currentTasaIndex]?.fechaActualizacion)}
                                        </TextMalet>

                                    </>
                                ) : (
                                    <View style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <ActivityIndicator size="small" color="#000" />
                                    </View>
                                )}
                            </Animated.View>
                        </LinearGradient>

                        <LinearGradient
                            colors={['#ffffff', '#ffffffff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ padding: 10, borderRadius: 10, width: '49%', gap: 8, borderWidth: 1, borderColor: '#f5f5f5' }}>
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
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    // Card style for BCV rate with subtle gradient and shadow
    tasaCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#dbd9d9ff',
        borderStyle: 'dashed',
        width: '48%',
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
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: '700',
        color: 'rgba(20, 20, 20, 1)',
        letterSpacing: -0.3,
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