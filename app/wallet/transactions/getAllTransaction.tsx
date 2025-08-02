import Button from "@/components/Button/Button";
import LastTransactions from "@/components/dashboard/LastTransactions";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { parseAccountNumber } from "@/shared/services/wallet/parseAccountNumber";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconAt from "@/svgs/dashboard/IconAt";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Modal, PanResponder, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GetAllTransaction() {
    const { user } = useAuthStore();
    const { getHistoryTransactions, loading: loadingWallet, transactions, paginationTransactions, setTransactions } = useWalletStore();
    const { accounts, error, getAllAccountsByUserId, selectedAccount, setSelectedAccount } = useAccountStore();

    const [modalVisible, setModalVisible] = useState(false);
    const MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    
    // Referencia para controlar el disparo prematuro de onEndReached
    const onEndReachedCalledDuringMomentum = useRef(true);

    useEffect(() => {
        if (modalVisible) {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 5, speed: 10 }).start();
        } else {
            Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
        }
    }, [modalVisible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) translateY.setValue(gestureState.dy); },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    setModalVisible(false);
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 5, speed: 10 }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (error) Alert.alert('Malet | Error', error);
    }, [error]);

    useEffect(() => {
        if (accounts.length === 0) getAllAccountsByUserId(user.id);
    }, []);

    useEffect(() => {
        if (selectedAccount?.id && transactions.length === 0) getHistoryTransactions(selectedAccount?.id || '', user.id, { refresh: true });
    }, []);

    const SkeletonLoader = () => (
        <View style={stylesAllTransaction.skeletonContainer}>
            <View style={[stylesAllTransaction.skeletonLine, { width: '60%', height: 24, marginBottom: 20 }]} />
            <View style={[stylesAllTransaction.skeletonCard, { marginBottom: 20 }]}>
                <View style={[stylesAllTransaction.skeletonLine, { width: '80%', height: 24, marginBottom: 20 }]} />
                <View style={stylesAllTransaction.skeletonFooter}>
                    <View>
                        <View style={[stylesAllTransaction.skeletonLine, { width: 100, height: 14, marginBottom: 8 }]} />
                        <View style={[stylesAllTransaction.skeletonLine, { width: 120, height: 18 }]} />
                    </View>
                    <View style={[stylesAllTransaction.skeletonCircle, { width: 22, height: 22 }]} />
                </View>
            </View>
            <View style={[stylesAllTransaction.skeletonLine, { width: '50%', height: 24, marginBottom: 10 }]} />
            {[1, 2, 3, 4, 5].map((_, index) => (
                <View key={index} style={[stylesAllTransaction.skeletonTransaction, { marginBottom: 12 }]}>
                    <View style={stylesAllTransaction.skeletonTransactionLeft}>
                        <View style={[stylesAllTransaction.skeletonCircle, { width: 40, height: 40, marginRight: 12 }]} />
                        <View>
                            <View style={[stylesAllTransaction.skeletonLine, { width: 120, height: 16, marginBottom: 4 }]} />
                            <View style={[stylesAllTransaction.skeletonLine, { width: 80, height: 14 }]} />
                        </View>
                    </View>
                    <View style={[stylesAllTransaction.skeletonLine, { width: 80, height: 18 }]} />
                </View>
            ))}
        </View>
    );

    if (loadingWallet && transactions.length === 0) {
        return (
            <LayoutAuthenticated>
                <SkeletonLoader />
            </LayoutAuthenticated>
        );
    }

    const onEndReached = () => {
        if (loadingWallet || paginationTransactions.isEnd) {
            return;
        }
        getHistoryTransactions(selectedAccount?.id || '', user.id, { refresh: false });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <LayoutAuthenticated>
                <View style={{ paddingBottom: 15 }}>
                    <TextMalet style={{ fontSize: 16 }}>Todas las Transacciones</TextMalet>
                </View>

                <View style={stylesAllTransaction.showcaseCard}>
                    <View>
                        <TextMalet style={stylesAllTransaction.repreAccountNumber}>{parseAccountNumber(selectedAccount?.id || '')}</TextMalet>
                    </View>
                    <View style={stylesAllTransaction.cardFooter}>
                        <View>
                            <TextMalet style={stylesAllTransaction.cardHolder}>Titular de la cuenta</TextMalet>
                            <TextMalet style={stylesAllTransaction.cardName}>{user.name}</TextMalet>
                        </View>
                        <IconAt style={{ width: 22, height: 22 }} />
                    </View>
                </View>

                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id.toString() + 1}
                    showsVerticalScrollIndicator={false}
                    style={stylesAllTransaction.transactionsList}
                    ListHeaderComponent={() => <TextMalet style={stylesAllTransaction.listHeader}>Transacciones recientes</TextMalet>}
                    renderItem={({ item }) => <LastTransactions item={item} />}
                    ListEmptyComponent={() => (
                        !loadingWallet ? <TextMalet style={stylesAllTransaction.emptyListText}>No hay transacciones recientes.</TextMalet> : null
                    )}
                    onRefresh={() => getHistoryTransactions(selectedAccount?.id || '', user.id, { refresh: true })}
                    refreshing={loadingWallet && transactions.length === 0}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.4}
                    onMomentumScrollBegin={() => {
                        onEndReachedCalledDuringMomentum.current = false;
                    }}
                    ListFooterComponent={() => loadingWallet && transactions.length > 0 ? <ActivityIndicator style={{ margin: 20 }} size="small" /> : null}
                />
            </LayoutAuthenticated>

            <View style={stylesAllTransaction.footerContainer}>
                <Button
                    text={`${selectedAccount ? `${selectedAccount.name} ${selectedAccount.currency}` : 'Seleccionar cuenta'}`}
                    onPress={() => setModalVisible(true)}
                    style={{ width: '100%' }}
                />
            </View>

            <Modal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                animationType="none"
                statusBarTranslucent={true}
                transparent={true}
            >
                <View style={stylesAllTransaction.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>

                    <Animated.View
                        style={[stylesAllTransaction.modalContainer, { transform: [{ translateY }], height: MODAL_HEIGHT }]}
                        {...panResponder.panHandlers}
                    >
                        <View style={stylesAllTransaction.modalHeader}>
                            <View style={stylesAllTransaction.modalHandle} />
                        </View>
                        <TextMalet style={stylesAllTransaction.modalTitle}>Seleccionar Cuenta</TextMalet>
                        <FlatList
                            data={accounts}
                            keyExtractor={item => item.id}
                            renderItem={({ item: account }) => (
                                <TouchableOpacity
                                    key={account.id}
                                    style={stylesAllTransaction.accountItem}
                                    onPress={() => {
                                        setModalVisible(false);

                                        setTimeout(() => {
                                            setTransactions([]);     
                                            setSelectedAccount(account);
                                            getHistoryTransactions(account.id, user.id, { refresh: true });
                                        }, 150);
                                    }}
                                >
                                    <TextMalet style={stylesAllTransaction.accountName}>{account.name}</TextMalet>
                                    <TextMalet style={stylesAllTransaction.accountBalance}>${account.balance.toFixed(2)}</TextMalet>
                                </TouchableOpacity>
                            )}
                        />
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const stylesAllTransaction = StyleSheet.create({
    showcaseCard: {
        width: '100%',
        minHeight: 140,
        backgroundColor: '#F0F0F0',
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    cardHolder: {
        color: '#555',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    repreAccountNumber: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 1.5,
        color: '#333',
    },
    cardName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111',
    },
    transactionsList: {
        flex: 1
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
    skeletonContainer: {
        padding: 2,
    },
    skeletonLine: {
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    skeletonCircle: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    skeletonTransaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    skeletonTransactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerContainer: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingTop: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    accountName: {
        fontSize: 16,
    },
    accountBalance: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    }
});