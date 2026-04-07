import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface WidgetContainerProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    blur?: boolean;
    gradient?: readonly [string, string, ...string[]];
}

/**
 * A standard container for dashboard widgets to maintain consistent styling.
 * Supports glassmorphism (blur) and linear gradients.
 */
export default function WidgetContainer({
    children,
    style,
    contentStyle,
    blur = false,
    gradient = ['rgba(255,255,255,1)', 'rgba(250,250,250,1)']
}: WidgetContainerProps) {
    const Component = blur && Platform.OS !== 'android' ? BlurView : View;
    const blurProps = blur && Platform.OS !== 'android' ? { intensity: 20 } : {};

    return (
        <View style={[styles.outer, style]}>
            <LinearGradient
                colors={gradient}
                style={styles.container}
            >
                <View style={[styles.content, contentStyle]}>
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
});
