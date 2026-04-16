import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button/Button";
import { useSAccounts } from "@/components/s-accounts/useSAccounts";
import { Header } from "@/components/s-accounts/Header/Header";
import { AccountCard } from "@/components/s-accounts/AccountCard/AccountCard";
import { EmptyState } from "@/components/s-accounts/EmptyState/EmptyState";
import { DetailsModal } from "@/components/s-accounts/DetailsModal/DetailsModal";

export default function SAccounts() {
    const {
        sharedAccounts,
        loading,
        modalVisible,
        selectedAccount,
        shareAmount,
        setShareAmount,
        loadAccounts,
        openCreateModal,
        openDetailsModal,
        closeDetailsModal,
        handleDelete,
        handleShare,
        handleEdit
    } = useSAccounts();

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            <View style={styles.content}>
                <FlatList
                    data={sharedAccounts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AccountCard item={item} onPress={openDetailsModal} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading && sharedAccounts.length === 0}
                    onRefresh={loadAccounts}
                    ListEmptyComponent={!loading ? <EmptyState /> : null}
                />
            </View>

            <View style={styles.footer}>
                <Button
                    text="Nueva S-Account"
                    onPress={openCreateModal}
                    style={styles.createButton}
                />
            </View>

            <DetailsModal
                visible={modalVisible}
                onClose={closeDetailsModal}
                account={selectedAccount}
                shareAmount={shareAmount}
                onShareAmountChange={setShareAmount}
                onShare={handleShare}
                onDelete={handleDelete}
                onEdit={handleEdit}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafbfc',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    footer: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 30,
    },
    createButton: {
        width: '100%',
        minHeight: 52,
        borderRadius: 12,
    }
});

