import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import IconAt from "@/svgs/dashboard/IconAt";

interface AuthLogoProps {
  logoScale: any;
}

const AuthLogo = ({ logoScale }: AuthLogoProps) => {
  return (
    <Animated.View style={[
      styles.logoContainer,
      { transform: [{ scale: logoScale }] },
    ]}>
      <IconAt style={styles.logo} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignSelf: 'flex-end',
  },
  logo: {
    width: 44,
    height: 44,
  },
});

export default AuthLogo;
