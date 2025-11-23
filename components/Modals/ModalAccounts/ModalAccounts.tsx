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
import React, { memo, useCallback, useEffect, useState, useRef } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Animated
} from "react-native";
import { AccountItem } from "./AccountItem";

interface ModalAccountsProps {
  visible: boolean;
  onClose: () => void;
}

const ModalAccounts = ({ visible, onClose }: ModalAccountsProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
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
        
        if (accounts.length > 0 && !forceRefresh) return;
        
        try {
            isLoadingRef.current = true;
            
            const shouldShowLoading = forceRefresh || accounts.length === 0;
            
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
            
            await getAllAccountsByUserId(user.id);
            
            if (isMounted.current) {
                spinValue.stopAnimation();
                spinValue.setValue(0);
                setIsRefreshing(false);
                isLoadingRef.current = false;
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
            if (isMounted.current) {
                Alert.alert('Error', 'No se pudieron cargar las cuentas');
                setIsRefreshing(false);
                isLoadingRef.current = false;
                spinValue.stopAnimation();
                spinValue.setValue(0);
            }
        }
    }, [getAllAccountsByUserId, user?.id, spinValue]);

    const handleRefresh = useCallback(() => {
        loadAccounts(true);
    }, [loadAccounts]);

    useEffect(() => {
        isMounted.current = true;
        
        if (visible) {
            if (accounts.length === 0) {
                loadAccounts(false);
            }
        }
        
        return () => {
            isMounted.current = false;
            spinValue.stopAnimation();
        };
    }, [visible, loadAccounts, spinValue, accounts.length]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error al cargar cuentas', error);
        }
    }, [error]);

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

    const renderSkeleton = () => {
        return (
            <View style={styles.skeletonContainer}>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonItem}>
                        <View style={styles.skeletonAvatar} />
                        <View style={styles.skeletonTextContainer}>
                            <View style={[styles.skeletonText, { width: '60%' }]} />
                            <View style={[styles.skeletonText, { width: '40%', marginTop: 8 }]} />
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderContent = useCallback(() => {
        if ((loading && accounts.length === 0) || isRefreshing) {
            return renderSkeleton();
        }

        if (accounts && accounts.length > 0) {
            return (
                <ScrollView 
                    style={styles.accountsList}
                    showsVerticalScrollIndicator={false}
                >
                    {accounts.map((account, index) => (
                        <AccountItem
                            key={account.id}
                            account={account}
                            onPress={handleAccountPress}
                            isLast={index === accounts.length - 1}
                        />
                    ))}
                </ScrollView>
            );
        }

        return (
            <View style={styles.centeredContent}>
                <TextMalet style={styles.emptyText}>
                    No tienes cuentas registradas.
                </TextMalet>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={handleCreateAccount}
                >
                    <TextMalet style={styles.addButtonText}>
                        Crear mi primera cuenta
                    </TextMalet>
                </TouchableOpacity>
            </View>
        );
    }, [loading, accounts, handleAccountPress, handleCreateAccount, isRefreshing]);

    return (
        <ModalOptions
            visible={visible}
            onClose={onClose}
        >
            <View style={styles.container}>
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

                {renderContent()}
            </View>
        </ModalOptions>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    skeletonContainer: {
        paddingVertical: spacing.small,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.medium,
        paddingHorizontal: spacing.small,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 12,
    },
    skeletonTextContainer: {
        flex: 1,
    },
    skeletonText: {
        height: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
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
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 16,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default memo(ModalAccounts);