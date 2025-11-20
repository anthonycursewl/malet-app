import Button from "@/components/Button/Button";
import { ContainerDash } from "@/components/dashboard/ContainerDash";
import LastTransactions from "@/components/dashboard/LastTransactions";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconVerified from "@/svgs/common/IconVerified";
import IconWarning from "@/svgs/common/IconWarning";
import IconAI from "@/svgs/dashboard/IconAI";
import IconArrow from "@/svgs/dashboard/IconArrow";
import IconAt from "@/svgs/dashboard/IconAt";
import IconBudget from "@/svgs/dashboard/IconBudget";
import IconFiles from "@/svgs/dashboard/IconFiles";
import IconMinus from "@/svgs/dashboard/IconMinus";
import IconNotes from "@/svgs/dashboard/IconNotes";
import IconPlus from "@/svgs/dashboard/IconPlus";
import { Link, router } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

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

const BalanceSection = memo(({ 
    balance, 
    onOpenModal 
}: { 
    balance: string, 
    onOpenModal: () => void 
}) => (
    <View style={styles.balanceSection}>
        <View style={styles.balanceContainer}>
            <TouchableOpacity 
                onPress={onOpenModal} 
                style={styles.balanceTouchable}
            >
                <TextMalet style={styles.balanceLabel}>Balance</TextMalet>
                <IconArrow width={18} height={18} />
            </TouchableOpacity>
            <ContainerDash style={styles.balanceValueContainer}>
                <TextMalet style={styles.balanceValue}>{balance}</TextMalet>
            </ContainerDash>
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
));

const DashboardHeader = memo(({ userName }: { userName: string }) => {
    const { width } = Dimensions.get('window');
    
    const getTruncatedName = useCallback((name: string) => {
        const maxLength = Math.floor(width / 15);
        const maxDisplayLength = Math.max(15, maxLength); 
        
        if (name.length > maxDisplayLength) {
            return `${name.slice(0, maxDisplayLength - 3)}...`;
        }
        return name;
    }, [width]);
    
    const formattedDate = useMemo(() => {
        const options = { 
            weekday: 'long' as const, 
            year: 'numeric' as const, 
            month: 'long' as const, 
            day: 'numeric' as const 
        };
        const dateStr = new Date().toLocaleDateString('es-ES', options);
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }, []);

    return (
        <View style={{ gap: 8 }}>
            <View style={{ paddingBottom: 7, paddingTop: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <TextMalet style={styles.headerText} numberOfLines={1}>
                        Bienvenido,{" "}
                    </TextMalet>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <TextMalet style={{ color: 'rgba(116, 116, 116, 1)' }}>{getTruncatedName(userName)}</TextMalet>
                        <IconVerified width={20} height={20} fill="rgba(94, 94, 94, 1)" />
                    </View>
                </View>
            
                <TextMalet style={{ color: 'rgb(95, 95, 95)', fontSize: 14 }}>
                    {formattedDate}
                </TextMalet>
            </View>

            <View style={styles.iconsContainer}>

                <ContainerDash>
                    <TouchableOpacity onPress={() => {}}>
                        <IconAt width={18} height={18} />
                    </TouchableOpacity>
                </ContainerDash>

                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconAI width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>

                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconNotes width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>

                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconBudget width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>

                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconFiles width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>

                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconWarning width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => {}}>
                        <IconWarning width={18} height={18} fill="#313131ff" />
                    </TouchableOpacity>
                </ContainerDash>
            </View>
            
        </View>
    );
});

export default function Dashboard() {
    const { user, verifySession } = useAuthStore();
    const { previewTransactions, getPreviewTransactions, error, loading } = useWalletStore();
    const { selectedAccount } = useAccountStore();
    
    const [loadingSession, setLoadingSession] = useState(false);
    const [modalAccountsVisible, setModalAccountsVisible] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoFadeAnim = useRef(new Animated.Value(0)).current;
    const modalAccountsRef = useRef<ModalAccountsRef>(null);

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

    const loadTransactions = useCallback(() => {
        if (user?.id) {
            getPreviewTransactions(selectedAccount?.id || '', user.id);
        }
    }, [user?.id, selectedAccount?.id, getPreviewTransactions]);

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
    }, [loadTransactions]);
    
    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error]);
    
    if (loadingSession) {
        return <LoadingScreen fadeAnim={fadeAnim} logoFadeAnim={logoFadeAnim} />;
    }
    
    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <DashboardHeader userName={user?.name || ''} />
                
                <BalanceSection 
                    balance={formattedBalance} 
                    onOpenModal={handleOpenModal} 
                />

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

                <View style={styles.viewAllTransactions}>
                    <Button text="Ver todas las transacciones" onPress={handleViewAllTransactions} 
                    style={{ width: '100%' }}
                    />
                </View>
            </View>
            
            <ModalAccounts visible={modalAccountsVisible} onClose={handleCloseModalAccounts} />
        </LayoutAuthenticated>
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
        gap: 5,
        flex: 1,
    },
    balanceTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    balanceLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    balanceValueContainer: {
        width: '100%',
        paddingVertical: 10,
    },
    balanceValue: {
        fontSize: 22,
        fontWeight: '700',
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
        marginTop: 20,
        flexGrow: 1,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    viewAllTransactions: {
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        width: '100%',
    }
});