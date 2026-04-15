import React from 'react';
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
import AuthHeader from "@/components/auth/AuthHeader";
import AuthLogo from "@/components/auth/AuthLogo";

export default function Index() {
  const {
    logoScale,
    logoRotation,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    subtitleTranslateY,
    formOpacity,
    formTranslateY,
    buttonOpacity,
    buttonScale,
    footerOpacity,
    pulseAnim,
  } = useLoginAnimations();

  const {
    credentials,
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
              <AuthLogo
                logoScale={logoScale}
                pulseAnim={pulseAnim}
                logoRotation={logoRotation}
              />

              <AuthHeader
                titleOpacity={titleOpacity}
                titleTranslateY={titleTranslateY}
                subtitleOpacity={subtitleOpacity}
                subtitleTranslateY={subtitleTranslateY}
              />

              <AuthForm
                formOpacity={formOpacity}
                formTranslateY={formTranslateY}
                emailValue={credentials.email}
                passwordValue={credentials.password}
                onEmailChange={handleEmailChange}
                onPasswordChange={handlePasswordChange}
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
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
