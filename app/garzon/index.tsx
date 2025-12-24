import GarzonDashboard from '@/components/garzon/GarzonDashboard';
import GarzonHeader from '@/components/garzon/GarzonHeader';
import GarzonLoginForm from '@/components/garzon/GarzonLoginForm';
import { useGarzonStore } from '@/shared/stores/useGarzonStore';
import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GarzonScreen() {
    const {
        isAuthenticated,
        isLoading,
        error,
        dashboardData,
        fetchedAt,
        login,
        logout,
        refreshDashboard,
    } = useGarzonStore();

    // Auto-refresh state
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

    const handleLogin = useCallback(async (credentials: { username: string; password: string }) => {
        const success = await login(credentials);
        return success;
    }, [login]);

    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);

    const handleRefresh = useCallback(async () => {
        await refreshDashboard();
    }, [refreshDashboard]);

    const handleAutoRefreshChange = useCallback((enabled: boolean, interval: number) => {
        setAutoRefreshEnabled(enabled);
        setAutoRefreshInterval(interval);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <GarzonHeader
                onRefresh={handleRefresh}
                onLogout={handleLogout}
                isLoading={isLoading}
                isAuthenticated={isAuthenticated}
                autoRefreshEnabled={autoRefreshEnabled}
                autoRefreshInterval={autoRefreshInterval}
                onAutoRefreshChange={handleAutoRefreshChange}
            />

            {isAuthenticated && dashboardData ? (
                <GarzonDashboard
                    data={dashboardData}
                    fetchedAt={fetchedAt}
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                />
            ) : (
                <View style={styles.loginContainer}>
                    <GarzonLoginForm
                        onLogin={handleLogin}
                        isLoading={isLoading}
                        error={error}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loginContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});
