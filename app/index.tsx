import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconWallet from "@/svgs/auth/IconWallet";
import IconAt from "@/svgs/dashboard/IconAt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function Index() {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });

  const { login, loading, setError } = useAuthStore();

  // Animaciones
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startEntryAnimations();
    startPulseAnimation();

    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        router.replace('/dashboard/dashboard');
      }
    };

    checkAuth();

    return () => {
      setError(null);
    };
  }, []);

  const startEntryAnimations = () => {
    // Logo animation (spring + rotate)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Title animation (delay: 200ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Subtitle animation (delay: 350ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 350);

    // Form animation (delay: 500ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // Button animation (delay: 700ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // Footer animation (delay: 900ms)
    setTimeout(() => {
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 900);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

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

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#ffffff', '#f8fafc', '#f1f5f9']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Logo Section */}
              <Animated.View style={[
                styles.logoContainer,
                {
                  transform: [
                    { scale: Animated.multiply(logoScale, pulseAnim) },
                    { rotate: logoRotation },
                  ],
                },
              ]}>
                <IconAt style={styles.logo} />
              </Animated.View>

              {/* Title */}
              <Animated.View style={[
                styles.titleContainer,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}>
                <TextMalet style={styles.title}>Bienvenido a Malet</TextMalet>
              </Animated.View>

              {/* Subtitle */}
              <Animated.View style={[
                styles.subtitleContainer,
                {
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslateY }],
                },
              ]}>
                <TextMalet style={styles.subtitle}>
                  Gestiona tus finanzas de forma inteligente
                </TextMalet>
              </Animated.View>

              {/* Form */}
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
                      value={credentials.email}
                      onChangeText={(text) => setCredentials(prev => ({ ...prev, email: text }))}
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
                      value={credentials.password}
                      onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
                      secureTextEntry
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Button */}
              <Animated.View style={[
                styles.buttonContainer,
                {
                  opacity: buttonOpacity,
                  transform: [{ scale: buttonScale }],
                },
              ]}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1a1a1a" />
                    <TextMalet style={styles.loadingText}>Iniciando sesión...</TextMalet>
                  </View>
                ) : (
                  <Button
                    text="Iniciar Sesión"
                    onPress={handleSubmit}
                    style={styles.loginButton}
                  />
                )}
              </Animated.View>

              {/* Footer */}
              <Animated.View style={[
                styles.footerContainer,
                { opacity: footerOpacity },
              ]}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <TextMalet style={styles.dividerText}>o continúa con</TextMalet>
                  <View style={styles.divider} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.brdButton]}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('BRD', 'Inicio de sesión con BRD próximamente')}
                  >
                    <View style={styles.brdIconContainer}>
                      <TextMalet style={styles.brdIconText}>BRD</TextMalet>
                    </View>
                    <TextMalet style={styles.socialButtonText}>BRD</TextMalet>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Google', 'Inicio de sesión con Google próximamente')}
                  >
                    <View style={styles.googleIconContainer}>
                      <TextMalet style={styles.googleIconText}>G</TextMalet>
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
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
  titleContainer: {
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleContainer: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
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
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
  },
  loadingContainer: {
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
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brdIconText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1a1a1a',
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
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
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
});
