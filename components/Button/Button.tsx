import React from "react";
import { ActivityIndicator, StyleProp, TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import TextMalet from "../TextMalet/TextMalet";

interface ButtonProps {
    text: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    loading?: boolean;
    labelStyle?: StyleProp<TextStyle>;
    variant?: 'chip' | 'pill';
    icon?: React.ReactNode;
}

export default function Button({ text, onPress, style, disabled, loading, labelStyle, variant = 'chip', icon }: ButtonProps) {
    const isDisabled = disabled || loading;

    const baseStyle: ViewStyle = variant === 'chip'
        ? {
            backgroundColor: '#000',
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            minHeight: 40,
        }
        : {
            backgroundColor: '#000',
            padding: 12,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            minHeight: 48,
        };

    const baseLabelStyle = variant === 'chip'
        ? { fontSize: 14, color: '#f4f4f5', fontWeight: '600' as const }
        : { fontSize: 16, color: '#f4f4f5' };

    return (
        <TouchableOpacity onPress={isDisabled ? undefined : onPress} style={[
            baseStyle,
            style,
            isDisabled && {
                opacity: 0.5,
            },
        ]} disabled={isDisabled}>
            {loading ? (
                <ActivityIndicator size="small" color="#f4f4f5" />
            ) : (
                <>
                    {icon}
                    <TextMalet style={[baseLabelStyle, labelStyle]}>{text}</TextMalet>
                </>
            )}
        </TouchableOpacity>
    )
}
