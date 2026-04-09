import TextMalet from "@/components/TextMalet/TextMalet";
import IconAt from "@/svgs/dashboard/IconAt";
import React, { memo, useEffect, useRef } from "react";
import { Animated, View } from 'react-native';
import { styles } from './styles';

export const EmptyAccountState = memo(() => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.emptyStateContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={styles.emptyStateIconContainer}>
                <IconAt width={60} height={60} />
            </View>
            <TextMalet style={styles.emptyStateTitle}>
                No has seleccionado una cuenta
            </TextMalet>
            <TextMalet style={styles.emptyStateDescription}>
                Selecciona una cuenta para ver tus movimientos.
            </TextMalet>
        </Animated.View>
    );
});
