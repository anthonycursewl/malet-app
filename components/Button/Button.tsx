import { ActivityIndicator, StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import TextMalet from "../TextMalet/TextMalet";

interface ButtonProps {
    text: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    loading?: boolean;
}

export default function Button({ text, onPress, style, disabled, loading }: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity onPress={isDisabled ? undefined : onPress} style={[
            {
                backgroundColor: '#000',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
            },
            isDisabled && {
                opacity: 0.5,
            },
            style
        ]} disabled={isDisabled}>
            {loading ? (
                <ActivityIndicator size="small" color="#f4f4f5" />
            ) : (
                <TextMalet style={{ fontSize: 16, color: '#f4f4f5' }}>{text}</TextMalet>
            )}
        </TouchableOpacity>
    )
}