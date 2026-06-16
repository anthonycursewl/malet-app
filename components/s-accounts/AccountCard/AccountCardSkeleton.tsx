import React, { memo, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { ShimmerEffect } from '@/components/malet-ai/ShimmerEffect';
import { styles } from './AccountCard.styles';

interface AccountCardSkeletonProps {
    delay?: number;
}

export const AccountCardSkeleton = memo(({ delay = 0 }: AccountCardSkeletonProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay, fadeAnim]);

    return (
        <Animated.View style={[{ opacity: fadeAnim }]}>
            <View style={[styles.card, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <ShimmerEffect style={{ width: 36, height: 36, borderRadius: 10 }} />
                <View style={{ flex: 1, gap: 6 }}>
                    <ShimmerEffect style={{ width: '55%', height: 14, borderRadius: 4 }} />
                    <ShimmerEffect style={{ width: '35%', height: 10, borderRadius: 3 }} />
                </View>
                <ShimmerEffect style={{ width: 16, height: 16, borderRadius: 8 }} />
            </View>
        </Animated.View>
    );
});
