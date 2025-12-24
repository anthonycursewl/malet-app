import TextMalet from "@/components/TextMalet/TextMalet";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { styles } from "./styles";

export const ThinkingIndicator = memo(() => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        shimmer.start();
        pulse.start();

        return () => {
            shimmer.stop();
            pulse.stop();
        };
    }, [shimmerAnim, pulseAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, 50],
    });

    const textTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-80, 80],
    });

    return (
        <View style={styles.thinkingContainer}>
            <Animated.View style={[styles.thinkingLogoContainer, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.thinkingLogo}>
                    <IconAt width={20} height={20} fill="#6B7280" />
                    {/* Shimmer overlay */}
                    <Animated.View style={[styles.thinkingShimmer, { transform: [{ translateX }] }]}>
                        <LinearGradient
                            colors={['transparent', 'rgba(255, 255, 255, 0.6)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
            </Animated.View>
            {/* Text with shimmer effect */}
            <View style={styles.thinkingTextContainer}>
                <TextMalet style={styles.thinkingText}>Pensando...</TextMalet>
                <Animated.View style={[styles.thinkingTextShimmer, { transform: [{ translateX: textTranslateX }] }]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(79, 70, 229, 0.3)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    );
});

ThinkingIndicator.displayName = 'ThinkingIndicator';
