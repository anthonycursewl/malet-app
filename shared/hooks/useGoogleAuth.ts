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
        console.log('--- useGoogleAuth: Starting signIn ---');
        try {
            await GoogleSignin.hasPlayServices();
            console.log('--- useGoogleAuth: Play Services OK ---');

            const response = await GoogleSignin.signIn();
            console.log('--- useGoogleAuth: Response Recived ---', JSON.stringify(response));

            if (response.type === 'cancelled') {
                console.log('User cancelled the login flow');
                return false;
            }

            if (response.data) {
                const idToken = response.data.idToken;
                console.log('--- useGoogleAuth: ID Token found ---', idToken ? 'YES' : 'NO');

                if (idToken) {
                    console.log('--- useGoogleAuth: Calling backend login ---');
                    const loginResult = await loginWithGoogle(idToken);
                    console.log('--- useGoogleAuth: Backend login result:', loginResult);
                    return loginResult;
                } else {
                    console.error('--- useGoogleAuth: Error - No ID Token in response data ---');
                    throw new Error('No se obtuvo el ID Token de Google');
                }
            } else {
                console.warn('--- useGoogleAuth: No response.data ---');
            }

            return false;

        } catch (error: any) {
            console.error('--- useGoogleAuth: CATCH ERROR ---', error);
            if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Operation (e.g. sign in) is in progress already');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.log('Play services not available or outdated');
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
