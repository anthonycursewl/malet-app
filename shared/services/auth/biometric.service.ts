import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const BIOMETRIC_TOKEN_KEY = 'user_biometric_token';

export class BiometricService {
    static async isSupported(): Promise<boolean> {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            return hasHardware && isEnrolled;
        } catch (error) {
            console.error('Biometric support error:', error);
            return false;
        }
    }

    static async authenticate(): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autenticación Biométrica requerida',
                fallbackLabel: 'Usar código',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (error) {
            console.error('Biometric auth error:', error);
            return false;
        }
    }

    static async askBiometricPermissionAndSave(token: string): Promise<void> {
        const supported = await this.isSupported();
        if (!supported) return;

        const hasConfigured = await this.hasStoredToken();
        if (hasConfigured) {
            // Ya la tenía configurada, actualizamos el token silenciosamente
            await this.saveToken(token);
            return;
        }

        return new Promise((resolve) => {
            Alert.alert(
                'Seguridad Biométrica',
                '¿Deseas habilitar tu huella o reconocimiento facial para proteger tu cuenta e iniciar sesión más rápido?',
                [
                    {
                        text: 'No, gracias',
                        style: 'cancel',
                        onPress: () => resolve()
                    },
                    {
                        text: 'Sí, habilitar',
                        onPress: async () => {
                            const success = await this.authenticate();
                            if (success) {
                                await this.saveToken(token);
                                Alert.alert('Malet | Éxito', 'Biometría configurada correctamente.');
                            }
                            resolve();
                        }
                    }
                ]
            );
        });
    }

    static async saveToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving biometric token:', error);
        }
    }

    static async getStoredToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
        } catch (error) {
            return null;
        }
    }

    static async clearStoredToken(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
        } catch (error) {
            console.error('Error clearing biometric token:', error);
        }
    }

    static async hasStoredToken(): Promise<boolean> {
        const token = await this.getStoredToken();
        return !!token;
    }
}
