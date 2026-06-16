import React, { memo, useEffect, useRef } from 'react';
import { Animated, FlatList, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { ShimmerEffect } from '@/components/malet-ai/ShimmerEffect';
import { useSAccounts } from '@/components/s-accounts/useSAccounts';
import { Header } from '@/components/s-accounts/Header/Header';
import { AccountCard } from '@/components/s-accounts/AccountCard/AccountCard';
import { AccountCardSkeleton } from '@/components/s-accounts/AccountCard/AccountCardSkeleton';
import { EmptyState } from '@/components/s-accounts/EmptyState/EmptyState';
import { DetailsModal } from '@/components/s-accounts/DetailsModal/DetailsModal';

const HeaderSkeleton = memo(() => {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[{ opacity: fadeAnim, paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 28, backgroundColor: '#ede4ff' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ShimmerEffect style={{ width: 38, height: 38, borderRadius: 12 }} />
                <View style={{ flex: 1, gap: 6 }}>
                    <ShimmerEffect style={{ width: 130, height: 20, borderRadius: 5 }} />
                    <ShimmerEffect style={{ width: 160, height: 13, borderRadius: 3 }} />
                </View>
            </View>
        </Animated.View>
    );
});

const ListSkeleton = memo(() => (
    <View style={{ padding: 20, paddingBottom: 40 }}>
        {[0, 1, 2, 3, 4].map(i => (
            <AccountCardSkeleton key={i} delay={i * 80} />
        ))}
    </View>
));

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

    const isLoading = loading && sharedAccounts.length === 0;

    if (isLoading) {
        return (
            <SafeAreaView edges={['bottom']} style={styles.container}>
                <HeaderSkeleton />
                <View style={styles.content}>
                    <ListSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
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
                    refreshing={loading}
                    onRefresh={loadAccounts}
                    ListEmptyComponent={<EmptyState />}
                />
            </View>

            <TouchableOpacity onPress={openCreateModal} style={styles.fab}>
                <Plus size={24} color="#fff" />
            </TouchableOpacity>

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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
});
