import { useGoogleAuth } from "@/shared/hooks/useGoogleAuth";
import { BiometricService } from "@/shared/services/auth/biometric.service";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";

const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email.trim()) {
    return { valid: false, error: 'El correo es requerido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de correo inválido' };
  }
  return { valid: true };
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Mínimo 6 caracteres' };
  }
  return { valid: true };
};

export const useLoginLogic = () => {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

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

  const validate = useCallback((): boolean => {
    const emailValidation = validateEmail(credentials.email);
    const passwordValidation = validatePassword(credentials.password);

    const errors: { email?: string; password?: string } = {};
    if (!emailValidation.valid) errors.email = emailValidation.error;
    if (!passwordValidation.valid) errors.password = passwordValidation.error;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [credentials.email, credentials.password]);

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const r = await login(credentials);
    if (r) {
      router.replace('/dashboard/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const success = await signInWithGoogle();
      if (success) {
        router.replace('/dashboard/dashboard');
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
    validationErrors,
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
