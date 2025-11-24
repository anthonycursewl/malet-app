import Button from "@/components/Button/Button";
import LastTransactions from "@/components/dashboard/LastTransactions";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { UserPrimitives } from "@/shared/entities/User";
import { parseAccountNumber } from "@/shared/services/wallet/parseAccountNumber";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

interface CardAnimationProps {
    user: UserPrimitives;
    selectedAccount: Account | null;
}

const StaticCard = memo(({ user, selectedAccount }: CardAnimationProps) => {
    const parsedAccountNumber = useMemo(() => parseAccountNumber(selectedAccount?.id || '0000 0000 0000'), [selectedAccount]);

    return (
        <View style={stylesAllTransaction.cardContainer}>
            <LinearGradient
                colors={['#FFFFFF', '#E9ECEF']}
                style={stylesAllTransaction.gradient}
            >
                <View style={stylesAllTransaction.wave} />
                <View style={stylesAllTransaction.wave2} />
                <View style={stylesAllTransaction.cardHeader}>
                    <TextMalet style={stylesAllTransaction.bankName}>MALET</TextMalet>
                    <View style={stylesAllTransaction.contactlessIcon}>
                        <View style={stylesAllTransaction.contactlessRing1} />
                        <View style={stylesAllTransaction.contactlessRing2} />
                        <View style={stylesAllTransaction.contactlessRing3} />
                    </View>
                </View>

                <LinearGradient
                    colors={['#888888ff', '#32333336']}
                    style={stylesAllTransaction.chip}
                />

                <View style={stylesAllTransaction.cardNumberContainer}>
                    <TextMalet style={stylesAllTransaction.repAccountNumber}>
                        {parsedAccountNumber}
                    </TextMalet>
                </View>

                <View style={stylesAllTransaction.cardFooter}>
                    <View>
                        <TextMalet style={stylesAllTransaction.cardHolder}>Malet-owner</TextMalet>
                        <TextMalet style={stylesAllTransaction.cardName} numberOfLines={1}>
                            {user?.name?.toUpperCase() || 'USUARIO'}
                        </TextMalet>
                    </View>
                    <IconAt width={30} height={30} fill="#343A40" />
                </View>
            </LinearGradient>
        </View>
    );
});

const SkeletonLoader = memo(() => (
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
));

const AccountBalance = memo(({ selectedAccount }: { selectedAccount: Account }) => {
    const accountBalance = useMemo(() => {
        return selectedAccount.balance
    }, [selectedAccount])

    return (
        <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={stylesAllTransaction.balanceContainer}
        >
            <TextMalet style={stylesAllTransaction.balanceLabel}>Saldo Disponible</TextMalet>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <TextMalet style={stylesAllTransaction.currencySymbol}>$</TextMalet>
                <TextMalet style={stylesAllTransaction.balanceAmount}>
                    {accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TextMalet>
                <TextMalet style={stylesAllTransaction.currency}> {selectedAccount.currency}</TextMalet>
            </View>
        </LinearGradient>
    );
});

export default function GetAllTransaction() {
    const { user } = useAuthStore();
    const [firstMount, setFirstMount] = useState(true);
    const { getHistoryTransactions, loading: loadingWallet, transactions, paginationTransactions, clearStore } = useWalletStore();
    const { accounts, error, getAllAccountsByUserId, selectedAccount } = useAccountStore();
    const [modalVisible, setModalVisible] = useState(false);
    const onEndReachedCalledDuringMomentum = useRef(true);

    useEffect(() => {
        if (error) Alert.alert('Malet | Error', error);
    }, [error]);

    useEffect(() => {
        if (accounts.length === 0) getAllAccountsByUserId(user.id);
    }, []);

    useEffect(() => {
        const getData = async () => {
            if (selectedAccount?.id) {
                const hasData = transactions && transactions.length > 0;
                const isSameAccount = hasData && transactions[0]?.account_id === selectedAccount.id;

                if (isSameAccount) {
                    setFirstMount(false);
                    return;
                }

                setFirstMount(true)
                clearStore();
                await getHistoryTransactions(selectedAccount.id, user.id, { refresh: true });
                setFirstMount(false)
            }
        };

        getData();
    }, [selectedAccount?.id, user.id]);



    const showSkeleton = firstMount && selectedAccount?.id;

    const onEndReached = () => {
        if (loadingWallet || paginationTransactions.isEnd || onEndReachedCalledDuringMomentum.current) {
            return;
        }
        getHistoryTransactions(selectedAccount?.id || '', user.id, { refresh: false });
    };


    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <LayoutAuthenticated>
                {showSkeleton ? (
                    <SkeletonLoader />
                ) : (
                    <>
                        <View style={{ paddingBottom: 15 }}>
                            <TextMalet style={{ fontSize: 16 }}>Todas las Transacciones</TextMalet>
                        </View>
                        <StaticCard user={user} selectedAccount={selectedAccount} />

                        {selectedAccount && (
                            <AccountBalance selectedAccount={selectedAccount} />
                        )}

                        <FlatList
                            key={`transactions-${selectedAccount?.id || 'no-account'}`}
                            initialNumToRender={10}
                            data={transactions}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            style={stylesAllTransaction.transactionsList}
                            ListHeaderComponent={() => <TextMalet style={stylesAllTransaction.listHeader}>Transacciones recientes</TextMalet>}
                            renderItem={({ item }) => <LastTransactions item={item} />}
                            ListEmptyComponent={() => (
                                !loadingWallet ? (
                                    <TextMalet style={stylesAllTransaction.emptyListText}>
                                        {selectedAccount?.id ? 'No hay transacciones recientes.' : 'Selecciona una cuenta para ver las transacciones.'}
                                    </TextMalet>
                                ) : null
                            )}
                            onRefresh={() => getHistoryTransactions(selectedAccount?.id || '', user.id, { refresh: true })}
                            refreshing={loadingWallet && transactions.length === 0}
                            onEndReached={onEndReached}
                            onEndReachedThreshold={0.4}
                            onScrollBeginDrag={() => { onEndReachedCalledDuringMomentum.current = false; }}
                            ListFooterComponent={() => loadingWallet && transactions.length > 0 ? (
                                <ActivityIndicator style={{ margin: 20 }} size="small" />
                            ) : null}
                            removeClippedSubviews={true}
                            windowSize={10}
                            maxToRenderPerBatch={10}
                            updateCellsBatchingPeriod={50}
                        />
                    </>
                )}
            </LayoutAuthenticated>
            <View style={stylesAllTransaction.footerContainer}>
                <Button text={`${selectedAccount ? `${selectedAccount.name} ${selectedAccount.currency}` : 'Seleccionar cuenta'}`} onPress={() => setModalVisible(true)} style={{ width: '100%' }} />
            </View>

            <ModalAccounts
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const stylesAllTransaction = StyleSheet.create({
    balanceContainer: {
        marginBottom: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
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
        transform: [{ translateY: -4 }],
    },
    currency: {
        fontSize: 12,
        color: '#adb5bd',
        fontWeight: '600',
        marginLeft: 4,
    },
    cardContainer: {
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    gradient: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        top: '60%',
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    wave2: {
        position: 'absolute',
        bottom: -150,
        right: -150,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bankName: {
        color: '#495057',
        fontSize: 14,
        fontWeight: 'bold',
    },
    contactlessIcon: {
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '90deg' }]
    },
    contactlessRing1: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', position: 'absolute' },
    contactlessRing2: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', position: 'absolute' },
    contactlessRing3: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', position: 'absolute' },
    chip: {
        width: 36,
        height: 28,
        borderRadius: 4,
        marginBottom: 12,
    },
    cardNumberContainer: {
        marginBottom: 8,
    },
    repAccountNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardHolder: {
        fontSize: 9,
        color: '#6C757D',
        marginBottom: 2,
        letterSpacing: 1,
        fontWeight: '600',
    },
    cardName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#212529',
        letterSpacing: 0.5,
        maxWidth: 160,
    },
    transactionsList: { flex: 1 },
    listHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10, },
    emptyListText: { textAlign: 'center', marginTop: 20, color: '#888', },
    skeletonContainer: { padding: 2, },
    skeletonLine: { backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 8, },
    skeletonCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, },
    skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, },
    skeletonCircle: { backgroundColor: '#f0f0f0', borderRadius: 20, },
    skeletonTransaction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, },
    skeletonTransactionLeft: { flexDirection: 'row', alignItems: 'center', },
    footerContainer: { padding: 20, justifyContent: 'center', alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end', },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 10, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, },
    modalHeader: { width: '100%', alignItems: 'center', paddingVertical: 10, },
    modalHandle: { width: 40, height: 5, backgroundColor: '#e0e0e0', borderRadius: 5, },
    modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center', },
    accountItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', },
    accountName: { fontSize: 16, },
    accountBalance: { fontSize: 14, color: '#666', },
    emptyText: { fontSize: 16, color: '#888', textAlign: 'center', }
});
