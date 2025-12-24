import { AccountCard } from "@/components/AccountCard/AccountCard";
import Button from "@/components/Button/Button";
import LastTransactions from "@/components/dashboard/LastTransactions";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, FlatList, InteractionManager, StyleSheet, View } from 'react-native';

// Shimmer Effect Component
const ShimmerEffect = memo(({ style }: { style?: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, 150],
    });

    return (
        <View style={[styles.shimmerBase, style]}>
            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

// Skeleton Item with staggered animation
const SkeletonTransactionItem = memo(({ delay }: { delay: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    return (
        <Animated.View style={[styles.skeletonTransaction, { opacity: fadeAnim }]}>
            <View style={styles.skeletonTransactionLeft}>
                <ShimmerEffect style={[styles.skeletonCircle, { width: 40, height: 40, marginRight: 12 }]} />
                <View>
                    <ShimmerEffect style={{ width: 120, height: 16, marginBottom: 6, borderRadius: 4 }} />
                    <ShimmerEffect style={{ width: 80, height: 12, borderRadius: 4 }} />
                </View>
            </View>
            <ShimmerEffect style={{ width: 70, height: 18, borderRadius: 4 }} />
        </Animated.View>
    );
});

// Premium Skeleton Loader with Shimmer
const SkeletonLoader = memo(() => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.skeletonContainer, { opacity: fadeAnim }]}>
            {/* Header */}
            <ShimmerEffect style={{ width: '55%', height: 22, marginBottom: 16, borderRadius: 6 }} />

            {/* Card Skeleton */}
            <View style={styles.skeletonCard}>
                <ShimmerEffect style={{ width: '75%', height: 22, marginBottom: 16, borderRadius: 6 }} />
                <View style={styles.skeletonFooter}>
                    <View>
                        <ShimmerEffect style={{ width: 90, height: 12, marginBottom: 8, borderRadius: 4 }} />
                        <ShimmerEffect style={{ width: 110, height: 16, borderRadius: 4 }} />
                    </View>
                    <ShimmerEffect style={[styles.skeletonCircle, { width: 24, height: 24 }]} />
                </View>
            </View>

            {/* Balance Skeleton */}
            <View style={styles.skeletonBalance}>
                <ShimmerEffect style={{ width: 100, height: 12, marginBottom: 8, borderRadius: 4 }} />
                <ShimmerEffect style={{ width: 150, height: 28, borderRadius: 6 }} />
            </View>

            {/* Transactions Header */}
            <ShimmerEffect style={{ width: '45%', height: 20, marginBottom: 12, borderRadius: 6 }} />

            {/* Transaction Items with staggered animation */}
            {[0, 1, 2, 3, 4].map((index) => (
                <SkeletonTransactionItem key={index} delay={index * 80} />
            ))}
        </Animated.View>
    );
});

// Memoized Account Balance Component
const AccountBalance = memo(({ selectedAccount }: { selectedAccount: Account }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const formattedBalance = useMemo(() => {
        return selectedAccount.balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }, [selectedAccount.balance]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceContainer}
            >
                <TextMalet style={styles.balanceLabel}>Saldo Disponible</TextMalet>
                <View style={styles.balanceRow}>
                    <TextMalet style={styles.currencySymbol}>$</TextMalet>
                    <TextMalet style={styles.balanceAmount}>{formattedBalance}</TextMalet>
                    <TextMalet style={styles.currency}> {selectedAccount.currency}</TextMalet>
                </View>
            </LinearGradient>
        </Animated.View>
    );
});

// Empty State Component for No Account Selected
const EmptyAccountState = memo(() => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.emptyStateContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={styles.emptyStateIconContainer}>
                <IconAt width={60} height={60} />
            </View>
            <TextMalet style={styles.emptyStateTitle}>
                No has seleccionado una cuenta
            </TextMalet>
            <TextMalet style={styles.emptyStateDescription}>
                Selecciona una cuenta para ver tus transacciones recientes.
            </TextMalet>
        </Animated.View>
    );
});

// Animated List Item Wrapper
const AnimatedTransactionItem = memo(({ item, index }: { item: any; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        const delay = Math.min(index * 50, 300); // Cap delay at 300ms
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [index]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <LastTransactions item={item} />
        </Animated.View>
    );
});

// Main Component
export default function GetAllTransaction() {
    const { user } = useAuthStore();
    const [firstMount, setFirstMount] = useState(true);
    const [isReady, setIsReady] = useState(false); // Wait for navigation to complete
    const {
        getHistoryTransactions,
        loading: loadingWallet,
        transactions,
        paginationTransactions,
        clearStore
    } = useWalletStore();
    const {
        accounts,
        error,
        getAllAccountsByUserId,
        selectedAccount
    } = useAccountStore();
    const [modalVisible, setModalVisible] = useState(false);
    const onEndReachedCalledDuringMomentum = useRef(true);
    const contentFadeAnim = useRef(new Animated.Value(0)).current;

    // Memoized handlers
    const handleOpenModal = useCallback(() => setModalVisible(true), []);
    const handleCloseModal = useCallback(() => setModalVisible(false), []);

    const handleRefresh = useCallback(() => {
        if (selectedAccount?.id) {
            getHistoryTransactions(selectedAccount.id, user.id, { refresh: true });
        }
    }, [selectedAccount?.id, user.id, getHistoryTransactions]);

    const handleEndReached = useCallback(() => {
        if (loadingWallet || paginationTransactions.isEnd || onEndReachedCalledDuringMomentum.current) {
            return;
        }
        if (selectedAccount?.id) {
            getHistoryTransactions(selectedAccount.id, user.id, { refresh: false });
        }
    }, [loadingWallet, paginationTransactions.isEnd, selectedAccount?.id, user.id, getHistoryTransactions]);

    const handleScrollBeginDrag = useCallback(() => {
        onEndReachedCalledDuringMomentum.current = false;
    }, []);

    // Memoized FlatList props
    const keyExtractor = useCallback((item: any) => item.id.toString(), []);

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <AnimatedTransactionItem item={item} index={index} />
    ), []);

    const ListHeaderComponent = useMemo(() => (
        <TextMalet style={styles.listHeader}>Transacciones recientes</TextMalet>
    ), []);

    const ListEmptyComponent = useMemo(() => {
        if (loadingWallet) return null;
        return (
            <TextMalet style={styles.emptyListText}>
                {selectedAccount?.id
                    ? 'No hay transacciones recientes.'
                    : 'Selecciona una cuenta para ver las transacciones.'}
            </TextMalet>
        );
    }, [loadingWallet, selectedAccount?.id]);

    const ListFooterComponent = useMemo(() => {
        if (!loadingWallet || transactions.length === 0) return null;
        return (
            <View style={styles.loadingFooter}>
                <View style={styles.loadingDot} />
                <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
                <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
            </View>
        );
    }, [loadingWallet, transactions.length]);

    const getItemLayout = useCallback((data: any, index: number) => ({
        length: 72,
        offset: 72 * index,
        index,
    }), []);

    // Button text memoized
    const buttonText = useMemo(() => {
        return selectedAccount
            ? `${selectedAccount.name} ${selectedAccount.currency}`
            : 'Seleccionar cuenta';
    }, [selectedAccount]);

    // Effects

    // Wait for navigation animation to complete before doing heavy work
    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
        });

        return () => interactionPromise.cancel();
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error]);

    // Load accounts only after ready
    useEffect(() => {
        if (!isReady) return;

        if (accounts.length === 0) {
            getAllAccountsByUserId();
        }
    }, [isReady, accounts.length, getAllAccountsByUserId]);

    // Load transactions only after ready
    useEffect(() => {
        if (!isReady) return;

        const getData = async () => {
            if (selectedAccount?.id) {
                const hasData = transactions && transactions.length > 0;
                const isSameAccount = hasData && transactions[0]?.account_id === selectedAccount.id;

                if (isSameAccount) {
                    setFirstMount(false);
                    // Animate content in
                    Animated.timing(contentFadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }).start();
                    return;
                }

                setFirstMount(true);
                contentFadeAnim.setValue(0);
                clearStore();
                await getHistoryTransactions(selectedAccount.id, user.id, { refresh: true });
                setFirstMount(false);
                // Animate content in
                Animated.timing(contentFadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            } else {
                setFirstMount(false);
                Animated.timing(contentFadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            }
        };

        getData();
    }, [isReady, selectedAccount?.id, user.id]);

    const showSkeleton = !isReady || (firstMount && selectedAccount?.id);

    return (
        <View style={styles.container}>
            <LayoutAuthenticated>
                {showSkeleton ? (
                    <SkeletonLoader />
                ) : (
                    <Animated.View style={[styles.contentContainer, { opacity: contentFadeAnim }]}>
                        <View style={styles.headerSection}>
                            <TextMalet style={styles.pageTitle}>Todas las Transacciones</TextMalet>
                        </View>

                        <AccountCard user={user} selectedAccount={selectedAccount} />

                        {selectedAccount ? (
                            <>
                                <AccountBalance selectedAccount={selectedAccount} />

                                <FlatList
                                    key={`transactions-${selectedAccount.id}`}
                                    data={transactions}
                                    keyExtractor={keyExtractor}
                                    renderItem={renderItem}
                                    showsVerticalScrollIndicator={false}
                                    style={styles.transactionsList}
                                    ListHeaderComponent={ListHeaderComponent}
                                    ListEmptyComponent={ListEmptyComponent}
                                    ListFooterComponent={ListFooterComponent}
                                    onRefresh={handleRefresh}
                                    refreshing={loadingWallet && transactions.length === 0}
                                    onEndReached={handleEndReached}
                                    onEndReachedThreshold={0.4}
                                    onScrollBeginDrag={handleScrollBeginDrag}
                                    getItemLayout={getItemLayout}
                                    // Performance optimizations
                                    initialNumToRender={8}
                                    maxToRenderPerBatch={8}
                                    windowSize={5}
                                    removeClippedSubviews={true}
                                    updateCellsBatchingPeriod={50}
                                />
                            </>
                        ) : (
                            <EmptyAccountState />
                        )}
                    </Animated.View>
                )}
            </LayoutAuthenticated>

            <View style={styles.footerContainer}>
                <Button
                    text={buttonText}
                    onPress={handleOpenModal}
                    style={styles.footerButton}
                />
            </View>

            <ModalAccounts
                visible={modalVisible}
                onClose={handleCloseModal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 15,
    },
    pageTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Balance styles
    balanceContainer: {
        marginBottom: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    balanceLabel: {
        fontSize: 11,
        color: '#868e96',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212529',
        letterSpacing: -0.5,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#868e96',
        marginRight: 4,
    },
    currency: {
        fontSize: 12,
        color: '#adb5bd',
        fontWeight: '600',
        marginLeft: 4,
    },
    // List styles
    transactionsList: {
        flex: 1,
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
    loadingFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 6,
    },
    loadingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#64748b',
    },
    // Shimmer styles
    shimmerBase: {
        backgroundColor: '#e8e8e8',
        overflow: 'hidden',
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    // Skeleton styles
    skeletonContainer: {
        paddingTop: 4,
    },
    skeletonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    skeletonCircle: {
        borderRadius: 50,
    },
    skeletonBalance: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    skeletonTransaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    skeletonTransactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Footer styles
    footerContainer: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    footerButton: {
        width: '100%',
    },
    // Empty state styles
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    emptyStateIconContainer: {
        marginBottom: 24,
    },
    emptyStateIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyStateIcon: {
        fontSize: 36,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 3,
    },
    emptyStateDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
});
