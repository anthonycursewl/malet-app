import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AuthBackground = () => {
  return (
    <>
      <LinearGradient
        colors={['#ffffff', '#f8fafc', '#f1f5f9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default AuthBackground;
