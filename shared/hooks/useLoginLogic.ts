import { useGoogleAuth } from "@/shared/hooks/useGoogleAuth";
import { BiometricService } from "@/shared/services/auth/biometric.service";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export const useLoginLogic = () => {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });

  const { login, loading, setError, verifySession, loginWithBiometrics, error } = useAuthStore();
  const { signInWithGoogle, request } = useGoogleAuth();
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifySession();
      if (isValid) {
        router.replace('/dashboard/dashboard');
        return;
      }

      // Si no es válido o no hay sesión, revisar si podemos mostrar biometría
      const canShow = await BiometricService.isSupported() && await BiometricService.hasStoredToken();
      setShowBiometric(canShow);
    };

    checkAuth();

    return () => {
      setError(null);
    };
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Malet | Error', error);
    }
  }, [error])

  const handleSubmit = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Malet | Error', 'Por favor, completa todos los campos');
      return;
    }

    const r = await login(credentials);
    if (r) {
      router.replace('/dashboard/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('--- Starting Google Login ---');
    try {
      const success = await signInWithGoogle();
      console.log('--- Google Login Result:', success);
      if (success) {
        console.log('--- Navigating to Dashboard ---');
        router.replace('/dashboard/dashboard');
      } else {
        console.log('--- Google Login Failed or Cancelled ---');
      }
    } catch (error) {
      console.error('--- Google Login Error:', error);
    }
  };

  const handleBiometricLogin = async () => {
    const success = await loginWithBiometrics();
    if (success) {
      router.replace('/dashboard/dashboard');
    }
  };

  const handleEmailChange = (text: string) => {
    setCredentials(prev => ({ ...prev, email: text }));
  };

  const handlePasswordChange = (text: string) => {
    setCredentials(prev => ({ ...prev, password: text }));
  };

  return {
    credentials,
    loading,
    showBiometric,
    request,
    handleSubmit,
    handleGoogleLogin,
    handleBiometricLogin,
    handleEmailChange,
    handlePasswordChange,
  };
};
