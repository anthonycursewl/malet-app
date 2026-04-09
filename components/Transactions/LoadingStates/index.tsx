import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { styles } from './styles';

export const ShimmerEffect = memo(({ style }: { style?: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, 150],
    });

    return (
        <View style={[styles.shimmerBase, style]}>
            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

export const SkeletonTransactionItem = memo(({ delay }: { delay: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    return (
        <Animated.View style={[styles.skeletonTransaction, { opacity: fadeAnim }]}>
            <View style={styles.skeletonTransactionLeft}>
                <ShimmerEffect style={[styles.skeletonCircle, { width: 40, height: 40, marginRight: 12 }]} />
                <View>
                    <ShimmerEffect style={{ width: 120, height: 16, marginBottom: 6, borderRadius: 4 }} />
                    <ShimmerEffect style={{ width: 80, height: 12, borderRadius: 4 }} />
                </View>
            </View>
            <ShimmerEffect style={{ width: 70, height: 18, borderRadius: 4 }} />
        </Animated.View>
    );
});

export const SkeletonLoader = memo(() => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.skeletonContainer, { opacity: fadeAnim }]}>
            <View style={styles.skeletonNavbar}>
                <ShimmerEffect style={{ width: 60, height: 24, borderRadius: 4 }} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                    <ShimmerEffect style={{ width: 100, height: 20, borderRadius: 4 }} />
                    <ShimmerEffect style={{ width: 140, height: 12, borderRadius: 4 }} />
                </View>
                <ShimmerEffect style={{ width: 30, height: 30, borderRadius: 8 }} />
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                    <SkeletonTransactionItem key={index} delay={index * 80} />
                ))}
            </View>
        </Animated.View>
    );
});
