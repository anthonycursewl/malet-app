import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    Onest: require('../assets/fonts/Onest.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.error("Error al cargar las fuentes", error);
      SplashScreen.hideAsync();
    }
    
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded || error) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}/>
  );
}