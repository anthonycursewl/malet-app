import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";

interface AuthFormProps {
  formOpacity: any;
  formTranslateY: any;
  emailValue: string;
  passwordValue: string;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
}

const AuthForm = ({
  formOpacity,
  formTranslateY,
  emailValue,
  passwordValue,
  onEmailChange,
  onPasswordChange,
}: AuthFormProps) => {
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
            style={styles.input}
            value={emailValue}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <TextMalet style={styles.label}>Contraseña</TextMalet>
        <View style={styles.inputWrapper}>
          <Input
            placeholder="••••••••"
            style={styles.input}
            value={passwordValue}
            onChangeText={onPasswordChange}
            secureTextEntry
          />
        </View>
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
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

export default AuthForm;
