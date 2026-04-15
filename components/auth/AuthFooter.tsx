import React from 'react';
import { Animated, StyleSheet, View, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import TextMalet from "@/components/TextMalet/TextMalet";
import IconGoogle from "@/svgs/auth/IconGoogle";
import IconWallet from "@/svgs/auth/IconWallet";

interface AuthFooterProps {
  footerOpacity: any;
  request: any;
  onGoogleLogin: () => void;
}

const AuthFooter = ({ footerOpacity, request, onGoogleLogin }: AuthFooterProps) => {
  return (
    <Animated.View style={[
      styles.footerContainer,
      { opacity: footerOpacity },
    ]}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <TextMalet style={styles.dividerText}>o continúa con</TextMalet>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity
          style={[styles.socialButton, styles.brdButton]}
          activeOpacity={0.8}
          onPress={() => Alert.alert('BRD', 'Inicio de sesión con BRD próximamente')}
        >
          <View style={styles.brdIconContainer}>
            <Image
              source={{ uri: 'https://bucket.breadriuss.com/brd/BRD_LOGO.webp' }}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
          <TextMalet style={styles.socialButtonText}>Breadriuss</TextMalet>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          activeOpacity={0.8}
          onPress={onGoogleLogin}
          disabled={!request}
        >
          <View style={styles.googleIconContainer}>
            <IconGoogle width={20} height={20} />
          </View>
          <TextMalet style={styles.socialButtonTextDark}>Google</TextMalet>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/auth/register')}
        style={styles.registerButton}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9']}
          style={styles.registerButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconWallet style={styles.registerIcon} />
          <View>
            <TextMalet style={styles.registerText}>
              ¿No tienes cuenta?
            </TextMalet>
            <TextMalet style={styles.registerTextBold}>
              Crea tu cuenta de Malet
            </TextMalet>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    gap: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 10,
  },
  brdButton: {
    backgroundColor: '#1a1a1a',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  brdIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  socialButtonTextDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  registerButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  registerIcon: {
    width: 28,
    height: 28,
  },
  registerText: {
    fontSize: 12,
    color: '#64748b',
  },
  registerTextBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
});

export default AuthFooter;
