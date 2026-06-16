import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AuthBackground = () => {
  return (
    <LinearGradient
      colors={['#ffffff', '#f8fafc', '#f1f5f9']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
  );
};

export default AuthBackground;
