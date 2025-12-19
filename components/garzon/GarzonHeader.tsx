import TextMalet from '@/components/TextMalet/TextMalet';
import IconArrow from '@/svgs/dashboard/IconArrow';
import IconReload from '@/svgs/dashboard/IconReload';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface GarzonHeaderProps {
    onRefresh?: () => void;
    onLogout?: () => void;
    isLoading?: boolean;
    isAuthenticated?: boolean;
}

const GarzonHeader = memo(({
    onRefresh,
    onLogout,
    isLoading = false,
    isAuthenticated = false,
}: GarzonHeaderProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <IconArrow width={20} height={20} />
                </View>
            </TouchableOpacity>

            <MaskedView
                style={{ height: 24, width: 150 }}
                maskElement={
                    <View style={{ backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <TextMalet style={styles.title}>Garzón x Malet</TextMalet>
                    </View>
                }
            >
                <LinearGradient
                    colors={['#2ba359ff', '#222222ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </MaskedView>

            <View style={styles.actionsContainer}>
                {isAuthenticated && (
                    <>
                        <TouchableOpacity
                            onPress={onRefresh}
                            style={styles.iconButton}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#F59E0B" />
                            ) : (
                                <IconReload width={18} height={18} fill="#6B7280" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                            <TextMalet style={styles.logoutText}>Salir</TextMalet>
                        </TouchableOpacity>
                    </>
                )}
                {!isAuthenticated && <View style={styles.placeholder} />}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: 0.3,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 6,
    },
    logoutButton: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    placeholder: {
        width: 28,
    },
});

export default GarzonHeader;
