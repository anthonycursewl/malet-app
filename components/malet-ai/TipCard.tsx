import TextMalet from "@/components/TextMalet/TextMalet";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { styles } from "./styles";

interface TipCardProps {
    tip: string;
}

export const TipCard = memo(({ tip }: TipCardProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: 400,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.contextCard, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={['rgba(79, 70, 229, 0.08)', 'rgba(124, 58, 237, 0.04)']}
                style={styles.contextGradient}
            >
                <View style={styles.contextHeader}>
                    <View style={styles.contextIconContainer}>
                        <TextMalet style={styles.contextIcon}>💡</TextMalet>
                    </View>
                    <TextMalet style={styles.contextTitle}>Tip del día</TextMalet>
                </View>
                <TextMalet style={styles.contextText}>{tip}</TextMalet>
            </LinearGradient>
        </Animated.View>
    );
});

TipCard.displayName = 'TipCard';
