import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import IconAt from "@/svgs/dashboard/IconAt";

interface AuthLogoProps {
  logoScale: any;
  pulseAnim: any;
  logoRotation: any;
}

const AuthLogo = ({ logoScale, pulseAnim, logoRotation }: AuthLogoProps) => {
  return (
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
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
});

export default AuthLogo;
