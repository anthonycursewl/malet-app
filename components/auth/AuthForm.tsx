import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import TextMalet from "@/components/TextMalet/TextMalet";
import { Feather } from '@expo/vector-icons';
import { InputField } from '@/components/AddWallet/InputField';

interface AuthFormProps {
  formOpacity: any;
  formTranslateY: any;
  emailValue: string;
  passwordValue: string;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  emailError?: string;
  passwordError?: string;
}

const AuthForm = ({
  formOpacity,
  formTranslateY,
  emailValue,
  passwordValue,
  onEmailChange,
  onPasswordChange,
  emailError,
  passwordError,
}: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Animated.View style={[
      styles.formContainer,
      {
        opacity: formOpacity,
        transform: [{ translateY: formTranslateY }],
      },
    ]}>
      <InputField
        label="Correo Electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={emailValue}
        onChangeText={onEmailChange}
        error={emailError}
      />

      <InputField
        label="Contraseña"
        placeholder="••••••••"
        value={passwordValue}
        onChangeText={onPasswordChange}
        secureTextEntry={!showPassword}
        error={passwordError}
        rightIcon={
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
        }
        onRightIconPress={() => setShowPassword(!showPassword)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
});

export default AuthForm;
