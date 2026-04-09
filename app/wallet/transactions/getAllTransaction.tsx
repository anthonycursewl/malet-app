import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import LastTransactions from "@/components/dashboard/LastTransactions";
import React from "react";
import { Animated, FlatList, StyleSheet, View } from 'react-native';

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
        setFilterModalVisible,
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
        buttonText
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
                            setFilterModalVisible={setFilterModalVisible}
                        />

                        <TagList
                            selectedTags={selectedTags}
                            onToggleTag={onToggleTag}
                        />

                        {isFiltering ? (
                            <View style={{ paddingHorizontal: 16 }}>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <SkeletonTransactionItem key={i} delay={i * 100} />
                                ))}
                            </View>
                        ) : (
                            <Animated.View style={[styles.listWrapper, { opacity: contentFadeAnim }]}>
                                {selectedAccount ? (
                                    <FlatList
                                        key={`transactions-${selectedAccount.id}`}
                                        data={transactions}
                                        keyExtractor={(item) => item.id.toString()}
                                        renderItem={({ item }) => <LastTransactions item={item} />}
                                        showsVerticalScrollIndicator={false}
                                        style={styles.transactionsList}
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
                                        initialNumToRender={8}
                                        maxToRenderPerBatch={8}
                                        windowSize={5}
                                        removeClippedSubviews={true}
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
                onClose={() => setFilterModalVisible(false)}
                filterTypes={filterTypes}
                hasActiveFilters={hasActiveFilters}
                startDate={startDate}
                endDate={endDate}
                datePickerType={datePickerType}
                setDatePickerType={setDatePickerType}
                toggleFilterType={toggleFilterType}
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
        flex: 1,
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
        height: 180,
        overflow: 'hidden'
    }
});
