import React, { useState } from 'react';
import { Animated, StyleSheet, View, TouchableOpacity } from 'react-native';
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Feather } from '@expo/vector-icons';

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
      <View style={styles.inputGroup}>
        <TextMalet style={styles.label}>Correo Electrónico</TextMalet>
        <View style={styles.inputWrapper}>
          <Input
            placeholder="tucorreo@ejemplo.com"
            style={[styles.input, emailError && styles.inputError]}
            value={emailValue}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError && <TextMalet style={styles.errorText}>{emailError}</TextMalet>}
      </View>

      <View style={styles.inputGroup}>
        <TextMalet style={styles.label}>Contraseña</TextMalet>
        <View style={styles.inputWrapper}>
          <Input
            placeholder="••••••••"
            style={[styles.input, passwordError && styles.inputError]}
            value={passwordValue}
            onChangeText={onPasswordChange}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.togglePassword}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        {passwordError && <TextMalet style={styles.errorText}>{passwordError}</TextMalet>}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  togglePassword: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
});

export default AuthForm;
