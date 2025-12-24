import { colors, spacing } from "@/shared/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface AccountItemSkeletonProps {
    delay?: number;
    isLast?: boolean;
}

// Componente Shimmer reutilizable
const ShimmerEffect = memo(({
    width,
    height,
    borderRadius = 4,
    style
}: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}) => {
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
        outputRange: [-150, 150],
    });

    return (
        <View style={[{
            width: width as any,
            height,
            borderRadius,
            overflow: 'hidden',
            backgroundColor: '#E8E8E8'
        }, style]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                ]}
            >
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

// Skeleton que replica la estructura de AccountItem
const AccountItemSkeleton = memo(({ delay = 0, isLast = false }: AccountItemSkeletonProps) => {
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
    }, [fadeAnim, delay]);

    return (
        <Animated.View style={[
            styles.container,
            isLast && styles.noBorder,
            { opacity: fadeAnim }
        ]}>
            <View style={styles.content}>
                {/* Avatar circle */}
                <ShimmerEffect
                    width={40}
                    height={40}
                    borderRadius={20}
                    style={styles.avatar}
                />

                {/* Text content */}
                <View style={styles.textContainer}>
                    {/* Account name */}
                    <ShimmerEffect width={120} height={16} borderRadius={4} />
                    {/* Balance */}
                    <ShimmerEffect
                        width={80}
                        height={14}
                        borderRadius={4}
                        style={{ marginTop: 6 }}
                    />
                </View>
            </View>
        </Animated.View>
    );
});

// Lista de skeletons con animación escalonada
export const AccountSkeletonList = memo(({ count = 3 }: { count?: number }) => {
    return (
        <View style={styles.listContainer}>
            {Array.from({ length: count }).map((_, index) => (
                <AccountItemSkeleton
                    key={index}
                    delay={index * 80}
                    isLast={index === count - 1}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: spacing.small,
    },
    container: {
        paddingVertical: spacing.medium,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        marginRight: spacing.medium,
    },
    textContainer: {
        flex: 1,
        gap: 0,
    },
});

export default AccountItemSkeleton;
