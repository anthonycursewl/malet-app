import IconAt from "@/svgs/dashboard/IconAt";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { styles } from "./styles";

export const AIAvatar = memo(() => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <Animated.View style={[styles.aiAvatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.aiCircle}>
                <IconAt height={32} width={32} fill="#1F2937" />
            </View>
        </Animated.View>
    );
});

AIAvatar.displayName = 'AIAvatar';
