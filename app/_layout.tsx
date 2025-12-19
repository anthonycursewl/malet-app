import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppProvider } from '../components/AppProvider';
import { useGarzonStore } from '../shared/stores/useGarzonStore';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    Onest: require('../assets/fonts/Onest.ttf'),
  });

  const restoreGarzonSession = useGarzonStore((state) => state.restoreSession);

  useEffect(() => {
    if (error) {
      console.error("Error al cargar las fuentes", error);
      SplashScreen.hideAsync();
    }

    if (fontsLoaded) {
      restoreGarzonSession();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error, restoreGarzonSession]);

  if (!fontsLoaded || error) {
    return null;
  }

  return (
    <AppProvider>
      <StatusBar style="dark" translucent={true} />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}