import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { spacing } from "@/shared/theme";
import IconAt from "@/svgs/dashboard/IconAt";
import IconPlus from "@/svgs/dashboard/IconPlus";
import IconReload from "@/svgs/dashboard/IconReload";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { AccountItem } from "./AccountItem";
import { AccountSkeletonList } from "./AccountItemSkeleton";

interface ModalAccountsProps {
    visible: boolean;
    onClose: () => void;
}

const ModalAccounts = ({ visible, onClose }: ModalAccountsProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasLoadError, setHasLoadError] = useState(false);
    const spinValue = useRef(new Animated.Value(0)).current;
    const isMounted = useRef(true);
    const isLoadingRef = useRef(false);
    const {
        loading,
        error,
        getAllAccountsByUserId,
        accounts,
        setSelectedAccount
    } = useAccountStore();
    const { user } = useAuthStore();

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const loadAccounts = useCallback(async (forceRefresh = false) => {
        if (!user?.id || isLoadingRef.current) return;


        if ((accounts?.length ?? 0) > 0 && !forceRefresh) return;

        try {
            isLoadingRef.current = true;
            setHasLoadError(false);

            const shouldShowLoading = forceRefresh || (accounts?.length ?? 0) === 0;

            if (shouldShowLoading) {
                setIsRefreshing(true);
                spinValue.setValue(0);
                Animated.loop(
                    Animated.timing(spinValue, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ).start();
            }

            await getAllAccountsByUserId();

            if (isMounted.current) {
                spinValue.stopAnimation();
                spinValue.setValue(0);
                setIsRefreshing(false);
                isLoadingRef.current = false;

                if (error) {
                    setHasLoadError(true);
                }
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
            if (isMounted.current) {
                setHasLoadError(true);
                setIsRefreshing(false);
                isLoadingRef.current = false;
                spinValue.stopAnimation();
                spinValue.setValue(0);
            }
        }
    }, [getAllAccountsByUserId, user?.id, spinValue, error]);

    const handleRefresh = useCallback(() => {
        loadAccounts(true);
    }, [loadAccounts]);

    useEffect(() => {
        isMounted.current = true;

        if (visible) {
            if ((accounts?.length ?? 0) === 0) {
                loadAccounts(false);
            }
        }

        return () => {
            isMounted.current = false;
            spinValue.stopAnimation();
        };
    }, [visible, loadAccounts, spinValue, accounts?.length]);

    const handleAccountPress = useCallback((account: Account) => {
        setSelectedAccount(account);
        onClose();
    }, [setSelectedAccount, onClose]);

    const handleCreateAccount = useCallback(() => {
        onClose();

        setTimeout(() => {
            router.push('/accounts/create');
        }, 300);
    }, [onClose, router]);

    const handleAccountLongPress = useCallback((account: Account) => {
        onClose();

        setTimeout(() => {
            router.push({
                pathname: '/accounts/edit',
                params: { accountId: account.id }
            });
        }, 300);
    }, [onClose, router]);

    // Render item optimizado para FlatList
    const renderAccountItem = useCallback(({ item, index }: { item: Account; index: number }) => (
        <AccountItem
            account={item}
            onPress={handleAccountPress}
            onLongPress={handleAccountLongPress}
            isLast={index === (accounts?.length ?? 0) - 1}
        />
    ), [handleAccountPress, handleAccountLongPress, accounts?.length]);

    // Key extractor para FlatList
    const keyExtractor = useCallback((item: Account) => item.id, []);

    const renderContent = useCallback(() => {
        if ((loading && (accounts?.length ?? 0) === 0) || isRefreshing) {
            return <AccountSkeletonList count={4} />;
        }

        if (hasLoadError && (accounts?.length ?? 0) === 0) {
            return (
                <View style={styles.errorContainer}>
                    <View style={styles.errorIconContainer}>
                        <TextMalet style={styles.errorIcon}>⚠️</TextMalet>
                    </View>
                    <TextMalet style={styles.errorTitle}>
                        Error al cargar cuentas
                    </TextMalet>
                    <TextMalet style={styles.errorMessage}>
                        No se pudieron cargar tus cuentas. Por favor, verifica tu conexión e intenta nuevamente.
                    </TextMalet>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => loadAccounts(true)}
                    >
                        <IconReload width={18} height={18} fill="#fff" />
                        <TextMalet style={styles.retryButtonText}>
                            Intentar de nuevo
                        </TextMalet>
                    </TouchableOpacity>
                </View>
            );
        }

        if (accounts && accounts.length > 0) {
            return (
                <FlatList
                    data={accounts}
                    renderItem={renderAccountItem}
                    keyExtractor={keyExtractor}
                    style={styles.accountsList}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    getItemLayout={(_, index) => ({
                        length: 72, // Altura aproximada de cada item
                        offset: 72 * index,
                        index,
                    })}
                />
            );
        }

        return (
            <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconContainer}>
                    <IconAt width={60} height={60} fill="#ccc" />
                </View>
                <TextMalet style={styles.emptyTitle}>
                    No tienes cuentas
                </TextMalet>
                <TextMalet style={styles.emptyMessage}>
                    Crea tu primera cuenta para comenzar a gestionar tus finanzas
                </TextMalet>
                <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={handleCreateAccount}
                    activeOpacity={0.8}
                >
                    <IconPlus width={20} height={20} fill="#fff" />
                    <TextMalet style={styles.createAccountButtonText}>
                        Crear cuenta
                    </TextMalet>
                </TouchableOpacity>
            </View>
        );
    }, [loading, accounts, handleAccountPress, handleCreateAccount, isRefreshing, hasLoadError, loadAccounts, handleAccountLongPress, renderAccountItem, keyExtractor]);

    return (
        <ModalOptions
            visible={visible}
            onClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <IconAt width={20} height={20} />
                            <TextMalet style={styles.headerTitle}>Seleccionar cuenta</TextMalet>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={handleRefresh}
                                disabled={isRefreshing || loading}
                                style={styles.reloadButton}
                            >
                                <Animated.View style={[styles.reloadIconContainer, { transform: [{ rotate: spin }] }]}>
                                    <IconReload
                                        width={22}
                                        height={22}
                                        fill={(isRefreshing || loading) ? '#ccc' : 'rgba(29, 29, 29, 1)'}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateAccount}>
                                <IconPlus width={25} height={25} fill={'rgba(29, 29, 29, 1)'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TextMalet style={styles.descriptionText}>Para editar una cuenta, manten presionando sobre la cuenta.</TextMalet>
                </View>

                {renderContent()}
            </View>
        </ModalOptions>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    descriptionText: {
        marginTop: spacing.small - 2,
        fontSize: 12,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContainer: {
        paddingBottom: spacing.medium,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    reloadButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reloadIconContainer: {
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    centeredContent: {
        flex: 1,
    },
    accountsList: {
        flex: 1,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.large,
    },
    emptyIconContainer: {
        marginBottom: spacing.medium,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: spacing.small,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: spacing.large,
        lineHeight: 20,
        maxWidth: 280,
    },
    createAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createAccountButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.large,
        paddingVertical: spacing.xlarge,
    },
    errorIconContainer: {
        marginBottom: spacing.medium,
    },
    errorIcon: {
        fontSize: 48,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: spacing.small,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: spacing.large,
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default memo(ModalAccounts);