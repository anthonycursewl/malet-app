import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import LastTransactions from "@/components/dashboard/LastTransactions";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Plus } from 'lucide-react-native';
import { Animated, StyleSheet, View } from 'react-native';

import Button from "@/components/Button/Button";

import { EmptyAccountState } from "@/components/Transactions/EmptyAccountState";
import { FilterModal } from "@/components/Transactions/FilterModal";
import { SkeletonLoader, SkeletonTransactionItem } from "@/components/Transactions/LoadingStates";
import { TagList } from "@/components/Transactions/TagList";
import { TransactionFooter } from "@/components/Transactions/TransactionFooter";
import { TransactionHeader } from "@/components/Transactions/TransactionHeader";
import { useTransactions } from "@/components/Transactions/hooks/useTransactions";

export default function GetAllTransaction() {
    const {
        loadingWallet,
        isFiltering,
        transactions,
        paginationTransactions,
        selectedAccount,
        isBalanceHidden,
        modalVisible,
        filterModalVisible,
        filterTypes,
        startDate,
        endDate,
        datePickerType,
        selectedTags,
        contentFadeAnim,
        showSkeleton,
        toggleBalanceHidden,
        setModalVisible,
        openFilterModal,
        closeFilterModal,
        setDatePickerType,
        handleOpenModal,
        handleCloseModal,
        handleRefresh,
        handleEndReached,
        applyFilters,
        toggleFilterType,
        onDateChange,
        clearFilters,
        setStartDate,
        setEndDate,
        onToggleTag,
        hasActiveFilters,
        buttonText,
        filterDeleted,
        setFilterDeleted
    } = useTransactions();

    return (
        <View style={styles.container}>
            <LayoutAuthenticated>
                {showSkeleton ? (
                    <SkeletonLoader />
                ) : (
                    <View style={styles.contentContainer}>
                        <TransactionHeader
                            selectedAccount={selectedAccount}
                            isBalanceHidden={isBalanceHidden}
                            hasActiveFilters={hasActiveFilters}
                            toggleBalanceHidden={toggleBalanceHidden}
                            setFilterModalVisible={openFilterModal}
                        />

                        <TagList
                            selectedTags={selectedTags}
                            onToggleTag={onToggleTag}
                        />

                        <View style={styles.addButtonContainer}>
                            <Button
                                text="Nueva transacción"
                                onPress={() => router.push('/wallet/add?type=expense')}
                                icon={<Plus size={18} color="#f4f4f5" />}
                                style={styles.addButton}
                            />
                        </View>

                        {isFiltering ? (
                            <View style={{ paddingHorizontal: 16 }}>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <SkeletonTransactionItem key={i} delay={i * 100} />
                                ))}
                            </View>
                        ) : (
                            <Animated.View style={[styles.listWrapper, { opacity: contentFadeAnim }]}>
                                {selectedAccount ? (
                                    <FlashList
                                        data={transactions as any}
                                        keyExtractor={(item: any) => item.id.toString()}
                                        renderItem={({ item }: any) => <LastTransactions item={item} />}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={styles.transactionsList}
                                        style={{ flex: 1 }}
                                        ListEmptyComponent={
                                            !loadingWallet ? (
                                                <TextMalet style={styles.emptyListText}>
                                                    No hay transacciones recientes.
                                                </TextMalet>
                                            ) : null
                                        }
                                        ListFooterComponent={
                                            loadingWallet && transactions.length > 0 && !paginationTransactions.isEnd ? (
                                                <View style={styles.footerSkeleton}>
                                                    <SkeletonTransactionItem delay={0} />
                                                    <SkeletonTransactionItem delay={100} />
                                                </View>
                                            ) : null
                                        }
                                        onRefresh={handleRefresh}
                                        refreshing={loadingWallet && transactions.length === 0 && !isFiltering}
                                        onEndReached={handleEndReached}
                                        onEndReachedThreshold={0.4}
                                    />
                                ) : (
                                    <EmptyAccountState />
                                )}
                            </Animated.View>
                        )}
                    </View>
                )}
            </LayoutAuthenticated>

            {!showSkeleton && (
                <TransactionFooter
                    buttonText={buttonText}
                    onPress={handleOpenModal}
                />
            )}

            <ModalAccounts
                visible={modalVisible}
                onClose={handleCloseModal}
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={closeFilterModal}
                filterTypes={filterTypes}
                hasActiveFilters={hasActiveFilters}
                startDate={startDate}
                endDate={endDate}
                datePickerType={datePickerType}
                setDatePickerType={setDatePickerType}
                toggleFilterType={toggleFilterType}
                filterDeleted={filterDeleted}
                setFilterDeleted={setFilterDeleted}
                clearFilters={clearFilters}
                onDateChange={onDateChange}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                applyFilters={applyFilters}
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
        marginHorizontal: -14,
    },
    listWrapper: {
        flex: 1,
        marginTop: -10,
    },
    transactionsList: {
        paddingHorizontal: 16,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    footerSkeleton: {
        paddingHorizontal: 0,
        paddingBottom: 10,
        overflow: 'hidden'
    },
    addButtonContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    addButton: {
        width: '100%',
    },
});
