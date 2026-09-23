import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AppProvider } from '../components/AppProvider';
import { useGarzonStore } from '../shared/stores/useGarzonStore';
import { useSessionStore } from '../shared/stores/useSessionStore';
import { offlineQueue } from '../shared/offline/offlineQueue';
import { useAccountStore } from '../shared/stores/useAccountStore';
import { useTagStore } from '../shared/stores/useTagStore';
import { useWalletStore } from '../shared/stores/useWalletStore';
import { useSharedAccountStore } from '../shared/stores/useSharedAccountStore';
SplashScreen.preventAutoHideAsync();

async function flushOfflineQueue() {
    const count = await offlineQueue.getCount();
    if (count === 0) return;
    const result = await offlineQueue.flush();
    if (result.success > 0) {
        const userId = useSessionStore.getState().currentUserId;
        if (userId) {
            const accountState = useAccountStore.getState();
            if (accountState.accounts.length > 0) {
                accountState.getAllAccountsByUserId({ refresh: true });
            }
            useTagStore.getState().loadTags();
            const walletState = useWalletStore.getState();
            if (walletState.previewTransactions.length > 0) {
                useAccountStore.getState().accounts.forEach((a) => {
                    walletState.getPreviewTransactions(a.id);
                });
            }
            useSharedAccountStore.getState().getSharedAccounts(undefined, { refresh: true });
        }
    }
}

async function onReconnect() {
    await flushOfflineQueue();
}

export default function RootLayout() {
    const [fontsLoaded, error] = useFonts({
        Onest: require('../assets/fonts/Onest.ttf'),
    });

    const restoreGarzonSession = useGarzonStore((state) => state.restoreSession);
    const hydrateSession = useSessionStore((state) => state.hydrate);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (error) {
            console.error("Error al cargar las fuentes", error);
            SplashScreen.hideAsync();
        }

        if (fontsLoaded) {
            hydrateSession();
            restoreGarzonSession();
            SplashScreen.hideAsync();

            const unsubNet = NetInfo.addEventListener((state) => {
                if (state.isConnected) {
                    onReconnect();
                }
            });

            return () => {
                unsubNet();
            };
        }
    }, [fontsLoaded, error, restoreGarzonSession, hydrateSession]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appState.current.match(/inactive|background/) && next === 'active') {
                NetInfo.fetch().then((state) => {
                    if (state.isConnected) {
                        onReconnect();
                    }
                });
            }
            appState.current = next;
        });
        return () => sub.remove();
    }, []);

    if (!fontsLoaded || error) {
        return null;
    }

    return (
        <AppProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
    );
}
