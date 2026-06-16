import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLoginAnimations } from "@/shared/hooks/useLoginAnimations";
import { useLoginLogic } from "@/shared/hooks/useLoginLogic";

import AuthActions from "@/components/auth/AuthActions";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthForm from "@/components/auth/AuthForm";
import AuthLogo from "@/components/auth/AuthLogo";
import NeuralMatrix from "@/components/auth/NeuralMatrix";

export default function Index() {
  const {
    logoScale,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    subtitleTranslateY,
    formOpacity,
    formTranslateY,
    buttonOpacity,
    buttonScale,
    footerOpacity,
  } = useLoginAnimations();

  const {
    credentials,
    validationErrors,
    loading,
    showBiometric,
    request,
    handleSubmit,
    handleGoogleLogin,
    handleBiometricLogin,
    handleEmailChange,
    handlePasswordChange
  } = useLoginLogic();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <AuthBackground />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              <View style={styles.topRow}>
                <NeuralMatrix />
                <AuthLogo logoScale={logoScale} />
              </View>

              <AuthForm
                formOpacity={formOpacity}
                formTranslateY={formTranslateY}
                emailValue={credentials.email}
                passwordValue={credentials.password}
                onEmailChange={handleEmailChange}
                onPasswordChange={handlePasswordChange}
                emailError={validationErrors?.email}
                passwordError={validationErrors?.password}
              />

              <AuthActions
                buttonOpacity={buttonOpacity}
                buttonScale={buttonScale}
                loading={loading}
                showBiometric={showBiometric}
                onSubmit={handleSubmit}
                onBiometricPress={handleBiometricLogin}
              />

              <AuthFooter
                footerOpacity={footerOpacity}
                request={request}
                onGoogleLogin={handleGoogleLogin}
              />
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
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
});
