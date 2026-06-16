import TextMalet from "@/components/TextMalet/TextMalet";
import IconGoogle from "@/svgs/auth/IconGoogle";
import { router } from "expo-router";
import { Alert, Animated, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

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
              source={{ uri: 'https://bucket.breadriuss.com/brd/brd_lg_dark.webp' }}
              style={{ width: 22, height: 22 }}
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
        activeOpacity={0.6}
      >
        <TextMalet style={styles.registerText}>
          ¿No tienes cuenta?{' '}
          <TextMalet style={styles.registerTextBold}>Crear cuenta</TextMalet>
        </TextMalet>
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
  registerText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  registerTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textDecorationLine: 'underline',
  },
});

export default AuthFooter;
