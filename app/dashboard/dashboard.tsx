import { ContainerDash } from "@/components/dashboard/ContainerDash";
import LastTransactions from "@/components/dashboard/LastTransactions";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconArrow from "@/svgs/dashboard/IconArrow";
import IconAt from "@/svgs/dashboard/IconAt";
import IconMinus from "@/svgs/dashboard/IconMinus";
import IconPlus from "@/svgs/dashboard/IconPlus";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type ModalAccountsRef = {
    openModal: () => void;
};

export default function Dashboard() {
    const { user, verifySession } = useAuthStore();
    const { transactions, getHistoryTransactions, error, loading } = useWalletStore();
    const { selectedAccount } = useAccountStore()

    const modalAccountsRef = useRef<ModalAccountsRef>(null);

    useEffect(() => {
        verifySession();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            getHistoryTransactions(selectedAccount.id, true)
        }

    }, [selectedAccount]);

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error])

    const today = new Date();
    
    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <ScrollView 
                        horizontal 
                        contentContainerStyle={styles.headerScroll}
                        showsHorizontalScrollIndicator={false}
                    >
                        <ContainerDash>
                            <TouchableOpacity onPress={() => console.log('Icon pressed')}>
                                <IconAt width={18} height={18} />
                            </TouchableOpacity>
                        </ContainerDash>
                        <ContainerDash>
                            <TextMalet style={styles.headerText}>
                                ¡Welcome {user.name}!
                            </TextMalet>
                        </ContainerDash>
                        <ContainerDash>
                            <TextMalet style={styles.headerText}>
                                {today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </TextMalet>
                        </ContainerDash>
                    </ScrollView>
                </View>

                <View style={styles.balanceSection}>
                    <View style={styles.balanceContainer}>
                        <TouchableOpacity 
                            onPress={() => modalAccountsRef.current?.openModal()} 
                            style={styles.balanceTouchable}
                        >
                            <TextMalet style={styles.balanceLabel}>Balance</TextMalet>
                            <IconArrow width={18} height={18} />
                        </TouchableOpacity>
                        
                        <ContainerDash style={styles.balanceValueContainer}>
                            <TextMalet style={styles.balanceValue}>{selectedAccount?.balance.toFixed(2)} {selectedAccount?.currency}</TextMalet>
                        </ContainerDash>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity onPress={() => console.log("remove")}>
                            <IconMinus width={40} height={40} fill={'rgb(255, 114, 114)'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/wallet/add')}>
                            <IconPlus width={45} height={45} fill={'rgb(38, 219, 93)'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.summaryBox}>
                    <TextMalet style={styles.summaryText}>Expense 50%</TextMalet>
                    <TextMalet style={styles.summaryText}>Saving 50%</TextMalet>
                </View>

                <FlatList 
                    data={transactions} 
                    showsVerticalScrollIndicator={false}
                    style={styles.transactionsList}
                    ListHeaderComponent={() => <TextMalet style={styles.listHeader}>Recent Transactions</TextMalet>}
                    renderItem={(item) => <LastTransactions item={item.item}/>}
                    ListEmptyComponent={() => <TextMalet style={styles.emptyListText}>No recent transactions</TextMalet>}
                    onRefresh={() => getHistoryTransactions(selectedAccount?.id || '', true)}
                    refreshing={loading}
                />
            </View>
            
            <ModalAccounts ref={modalAccountsRef} />
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        height: 50,
        marginTop: 2,
    },
    headerScroll: {
        gap: 8,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 15,
    },
    balanceSection: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    balanceContainer: {
        gap: 5,
        flex: 1, // Permite que ocupe el espacio disponible
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
        marginTop: 20,
    },
    summaryText: {
        fontSize: 15,
    },
    transactionsList: {
        flex: 1,
        marginTop: 20,
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
    }
});