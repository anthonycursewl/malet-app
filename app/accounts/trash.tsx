import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import { AccountItem } from "@/components/Modals/ModalAccounts/AccountItem";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export default function TrashAccounts() {
    const { deletedAccounts, getDeletedAccounts, restoreAccount, loading } = useAccountStore();

    useEffect(() => {
        getDeletedAccounts({ refresh: true });
    }, [getDeletedAccounts]);

    const handleRestore = useCallback((account: Account) => {
        Alert.alert(
            'Restaurar Cuenta',
            `¿Deseas restaurar la cuenta "${account.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restaurar',
                    onPress: async () => {
                        const success = await restoreAccount(account.id);
                        if (success) {
                            Alert.alert('Malet | Éxito', 'Cuenta restaurada correctamente.');
                        }
                    }
                }
            ]
        );
    }, [restoreAccount]);

    const renderItem = useCallback(({ item, index }: { item: Account; index: number }) => (
        <AccountItem
            account={item}
            onPress={handleRestore}
            isLast={index === deletedAccounts.length - 1}
        />
    ), [handleRestore, deletedAccounts.length]);

    const handleEndReached = useCallback(() => {
        getDeletedAccounts({ refresh: false });
    }, [getDeletedAccounts]);

    const keyExtractor = useCallback((item: Account) => item.id, []);

    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <IconAt width={60} height={60} fill="#ccc" />
            </View>
            <TextMalet style={styles.emptyTitle}>
                Papelera vacía
            </TextMalet>
            <TextMalet style={styles.emptyText}>
                No hay cuentas en la papelera.
            </TextMalet>
        </View>
    ), []);

    const renderHeader = useMemo(() => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <TextMalet style={styles.backText}>← Volver</TextMalet>
            </TouchableOpacity>
            <TextMalet style={styles.textTitle}>Papelera de Cuentas</TextMalet>
        </View>
    ), []);

    if (loading && deletedAccounts.length === 0) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    {renderHeader}
                    <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
                </View>
            </LayoutAuthenticated>
        );
    }

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                {renderHeader}

                <TextMalet style={styles.description}>
                    Las cuentas aquí se eliminarán definitivamente después de 30 días de su borrado lógico.
                </TextMalet>

                <FlatList
                    data={deletedAccounts}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={deletedAccounts.length === 0 ? styles.flex1 : styles.paddingBottom50}
                    renderItem={renderItem}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmpty}
                />
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 8,
    },
    flex1: {
        flex: 1,
    },
    paddingBottom50: {
        paddingBottom: 50,
    },
    header: {
        marginTop: 10,
        marginBottom: 10,
    },
    backButton: {
        marginBottom: 12,
    },
    backText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    textTitle: {
        fontSize: 22,
        fontWeight: '700'
    },
    description: {
        fontSize: 13,
        color: '#888',
        marginBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 40,
    },
    emptyIconContainer: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    }
});
