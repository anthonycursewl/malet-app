import TextMalet from "@/components/TextMalet/TextMalet";
import React, { memo, useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import { styles } from "./styles";
import { Suggestion } from "./types";

interface SuggestionChipProps {
    suggestion: Suggestion;
    onPress: () => void;
    delay: number;
}

export const SuggestionChip = memo(({ suggestion, onPress, delay }: SuggestionChipProps) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay, scaleAnim, opacityAnim]);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
            <TouchableOpacity
                style={styles.suggestionChip}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <TextMalet style={styles.suggestionText}>{suggestion.text}</TextMalet>
            </TouchableOpacity>
        </Animated.View>
    );
});

SuggestionChip.displayName = 'SuggestionChip';
