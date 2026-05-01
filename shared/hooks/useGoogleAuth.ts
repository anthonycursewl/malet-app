import { useAuthStore } from '@/shared/stores/useAuthStore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

// Configure Google Sign-In once
GoogleSignin.configure({
    // Cliente Web: Necesario para obtener el idToken que el backend validará
    webClientId: '716173489241-f4fi5qr35tegdac8l3kqte7jmc3ud0l7.apps.googleusercontent.com',
    // Cliente Android: Aunque la librería usa auto-detección por defecto vía google-services.json o SHA-1,
    // es buena práctica no forzarlo si no estamos seguros. No ponemos androidClientId manual a menos que usemos strings.xml
    // androidClientId: '716173489241-fe67mcv3e4e8naeg11hjarkns5o76tjj.apps.googleusercontent.com',
    offlineAccess: true,
    scopes: ['profile', 'email', 'openid'],
});

export const useGoogleAuth = () => {
    const { loginWithGoogle, loading, error } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Check if play services are available
                await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
                setIsReady(true);
            } catch (err) {
                console.error('Play services error', err);
            }
        };
        init();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();

            const response = await GoogleSignin.signIn();

            if (response.type === 'cancelled') {
                return false;
            }

            if (response.data) {
                const idToken = response.data.idToken;

                if (idToken) {
                    const loginResult = await loginWithGoogle(idToken);
                    return loginResult;
                } else {
                    throw new Error('No se obtuvo el ID Token de Google');
                }
            }

            return false;

        } catch (error: any) {
            if (error.code === statusCodes.IN_PROGRESS) {
                // Operation in progress - ignore
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.error('Play services not available or outdated');
            } else {
                console.error('Google Sign-In Error', error);
            }
            return false;
        }
    };

    return {
        signInWithGoogle,
        // En esta librería no necesitamos un objeto "request" asíncrono, así que devolvemos true si está listo
        request: isReady,
        loading,
        error,
        user: useAuthStore(state => state.user),
    };
};
