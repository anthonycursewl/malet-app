import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";
import { styles } from "./styles";

interface ShimmerEffectProps {
    style?: ViewStyle;
}

export const ShimmerEffect = memo(({ style }: ShimmerEffectProps) => {
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
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });

    return (
        <View style={[styles.shimmerBase, style]}>
            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

ShimmerEffect.displayName = 'ShimmerEffect';
