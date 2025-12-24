import React, { memo, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { ShimmerEffect } from "./ShimmerEffect";
import { styles } from "./styles";

export const SkeletonLoader = memo(() => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.skeletonContainer, { opacity: fadeAnim }]}>
            {/* AI Circle skeleton */}
            <View style={styles.skeletonAiContainer}>
                <ShimmerEffect style={styles.skeletonAiCircle} />
                <ShimmerEffect style={{ width: 180, height: 24, borderRadius: 8, marginTop: 16 }} />
                <ShimmerEffect style={{ width: 220, height: 16, borderRadius: 6, marginTop: 8 }} />
            </View>

            {/* Suggestions skeleton */}
            <View style={styles.skeletonSuggestions}>
                <ShimmerEffect style={{ width: 140, height: 40, borderRadius: 20 }} />
                <ShimmerEffect style={{ width: 120, height: 40, borderRadius: 20 }} />
                <ShimmerEffect style={{ width: 150, height: 40, borderRadius: 20 }} />
                <ShimmerEffect style={{ width: 110, height: 40, borderRadius: 20 }} />
            </View>

            {/* Tip card skeleton */}
            <View style={styles.skeletonTipCard}>
                <ShimmerEffect style={{ width: 100, height: 16, borderRadius: 6, marginBottom: 12 }} />
                <ShimmerEffect style={{ width: '100%', height: 14, borderRadius: 4, marginBottom: 8 }} />
                <ShimmerEffect style={{ width: '80%', height: 14, borderRadius: 4 }} />
            </View>
        </Animated.View>
    );
});

SkeletonLoader.displayName = 'SkeletonLoader';
