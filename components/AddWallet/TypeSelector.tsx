import React, { memo, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { selectorStyles as styles } from './add.styles';

interface TypeSelectorProps {
  type: 'expense' | 'saving' | 'pending_payment';
  onTypeChange: (type: 'expense' | 'saving') => void;
  disabled?: boolean;
}

export const TypeSelector = memo(({ type, onTypeChange, disabled }: TypeSelectorProps) => {
  const animatedValue = useRef(new Animated.Value(type === 'expense' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: type === 'expense' ? 0 : 1,
      friction: 10,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [type]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 110],
  });

  const expenseColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#000000'],
  });

  const savingColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', '#FFFFFF'],
  });

  return (
    <View style={[styles.selectorContainer, disabled && { opacity: 0.3 }]} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.selectorTrack}>
        <Animated.View style={[styles.selectorIndicator, { transform: [{ translateX }] }]} />
        <TouchableOpacity style={styles.selectorTab} onPress={() => onTypeChange('expense')} activeOpacity={1}>
          <Animated.Text style={[styles.selectorText, { color: expenseColor }]}>Salida</Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectorTab} onPress={() => onTypeChange('saving')} activeOpacity={1}>
          <Animated.Text style={[styles.selectorText, { color: savingColor }]}>Entrada</Animated.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
