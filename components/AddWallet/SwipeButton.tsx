import TextMalet from '@/components/TextMalet/TextMalet';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, View } from 'react-native';
import { swipeStyles as styles } from './add.styles';

interface SwipeButtonProps {
  onSwipeComplete: () => Promise<boolean | any> | boolean | any;
  loading: boolean;
}

const THUMB_SIZE = 50;
const TRACK_PADDING = 4;

export const SwipeButton = ({ onSwipeComplete, loading }: SwipeButtonProps) => {
  const pan = useRef(new Animated.Value(0)).current;
  const widthRef = useRef(0);
  const onSwipeCompleteRef = useRef(onSwipeComplete);

  useEffect(() => {
    onSwipeCompleteRef.current = onSwipeComplete;
  }, [onSwipeComplete]);

  // Reset thumb position when loading finishes
  useEffect(() => {
    if (!loading) {
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [loading]);

  const handleLayout = useCallback((e: any) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !loading,
        onMoveShouldSetPanResponder: () => !loading,
        onPanResponderMove: (_e, gesture) => {
          const maxTravel = widthRef.current - THUMB_SIZE - TRACK_PADDING * 2;
          if (gesture.dx > 0 && gesture.dx <= maxTravel) {
            pan.setValue(gesture.dx);
          }
        },
        onPanResponderRelease: async (_e, gesture) => {
          const maxTravel = widthRef.current - THUMB_SIZE - TRACK_PADDING * 2;
          const threshold = maxTravel * 0.45;

          if (gesture.dx >= threshold) {
            // SNAP END
            Animated.spring(pan, {
              toValue: maxTravel,
              useNativeDriver: false,
              friction: 10,
              tension: 60,
            }).start();

            // TRIGGER
            try {
              const res = await onSwipeCompleteRef.current();
              if (res === false) {
                // Return thumb if validation failed
                Animated.spring(pan, {
                  toValue: 0,
                  friction: 8,
                  tension: 40,
                  useNativeDriver: false,
                }).start();
              }
            } catch (err) {
              // Return thumb if crash
              Animated.spring(pan, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: false,
              }).start();
            }
          } else {
            // Return thumb if threshold not met
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          }
        },
      }),
    [loading],
  );

  // Animate label opacity based on thumb position
  const labelOpacity = pan.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.track} onLayout={handleLayout}>
      <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
        <TextMalet style={styles.label}>
          {loading ? 'PROCESANDO...' : 'DESLIZA PARA GUARDAR'}
        </TextMalet>
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          { transform: [{ translateX: pan }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <MaterialIcons name="chevron-right" size={32} color="#fff" />
        )}
      </Animated.View>
    </View>
  );
};
