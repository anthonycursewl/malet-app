import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBlockProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const containerStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };

  return (
    <View style={[containerStyle, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonSummaryCard({ style, position }: SkeletonCardProps & { position?: 'left' | 'right' }) {
  const cardStyle: ViewStyle[] = [styles.skeletonCard];
  if (position === 'left') cardStyle.push({ borderRightWidth: 0 });
  else if (position === 'right') cardStyle.push({ borderLeftWidth: 0 });
  if (style) cardStyle.push(style);

  return (
    <View style={cardStyle}>
      <View style={styles.skeletonCardHeader}>
        <SkeletonBlock width={14} height={14} borderRadius={7} />
        <SkeletonBlock width={70} height={12} borderRadius={6} />
      </View>
      <SkeletonBlock width={100} height={22} borderRadius={8} />
    </View>
  );
}

export function SkeletonChart({ style }: SkeletonCardProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const linePath = 'M 10 120 C 50 80, 90 140, 130 90 C 170 40, 210 110, 250 70 C 290 30, 330 100, 350 60';

  return (
    <View style={[styles.skeletonChart, style]}>
      <View style={styles.skeletonChartInner}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <View key={ratio} style={[styles.gridLine, { bottom: `${ratio * 100}%` }]} />
        ))}
        <Svg width="100%" height={160} viewBox="0 0 360 160" style={styles.skeletonLine}>
          <Path
            d={linePath}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.skeletonLabels}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonBlock key={i} width={16} height={8} borderRadius={4} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonTags({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.skeletonTags, style]}>
      <SkeletonBlock width={80} height={12} borderRadius={6} style={{ marginBottom: 4 }} />
      {[1, 2, 3].map((i) => (
        <View key={`e-${i}`} style={styles.skeletonTagRow}>
          <SkeletonBlock width={10} height={10} borderRadius={5} />
          <SkeletonBlock width={`${50 + Math.random() * 30}%`} height={10} borderRadius={5} />
          <SkeletonBlock width={50} height={10} borderRadius={5} />
        </View>
      ))}
      <SkeletonBlock width={80} height={12} borderRadius={6} style={{ marginTop: 8, marginBottom: 4 }} />
      {[1, 2].map((i) => (
        <View key={`i-${i}`} style={styles.skeletonTagRow}>
          <SkeletonBlock width={10} height={10} borderRadius={5} />
          <SkeletonBlock width={`${40 + Math.random() * 25}%`} height={10} borderRadius={5} />
          <SkeletonBlock width={50} height={10} borderRadius={5} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 14,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skeletonChart: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  skeletonChartInner: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  skeletonLine: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  skeletonLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  skeletonTags: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  skeletonTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
