import React from 'react';
import { Animated, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button/Button";
import TextMalet from "@/components/TextMalet/TextMalet";

interface AuthActionsProps {
  buttonOpacity: any;
  buttonScale: any;
  loading: boolean;
  showBiometric: boolean;
  onSubmit: () => void;
  onBiometricPress: () => void;
}

const AuthActions = ({
  buttonOpacity,
  buttonScale,
  loading,
  showBiometric,
  onSubmit,
  onBiometricPress,
}: AuthActionsProps) => {
  return (
    <Animated.View style={[
      styles.buttonContainer,
      {
        opacity: buttonOpacity,
        transform: [{ scale: buttonScale }],
      },
    ]}>
      <View style={styles.loginActionsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1a1a1a" />
            <TextMalet style={styles.loadingText}>Iniciando sesión...</TextMalet>
          </View>
        ) : (
          <>
            <Button
              text="Iniciar Sesión"
              onPress={onSubmit}
              style={[styles.loginButton, showBiometric && styles.loginButtonWithBiometric]}
            />
            {showBiometric && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={onBiometricPress}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print-outline" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  loginActionsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
  },
  loginButtonWithBiometric: {
    flex: 1,
  },
  biometricButton: {
    width: 54,
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default AuthActions;
