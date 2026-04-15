import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import TextMalet from "@/components/TextMalet/TextMalet";

interface AuthHeaderProps {
  titleOpacity: any;
  titleTranslateY: any;
  subtitleOpacity: any;
  subtitleTranslateY: any;
}

const AuthHeader = ({
  titleOpacity,
  titleTranslateY,
  subtitleOpacity,
  subtitleTranslateY
}: AuthHeaderProps) => {
  return (
    <>
      <Animated.View style={[
        styles.titleContainer,
        {
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        },
      ]}>
        <TextMalet style={styles.title}>Bienvenido a Malet</TextMalet>
      </Animated.View>

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
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default AuthHeader;
