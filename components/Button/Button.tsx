import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import TextMalet from "../TextMalet/TextMalet";

interface ButtonProps {
    text: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
}

export default function Button({ text, onPress, style, disabled }: ButtonProps) {
    return (
        <TouchableOpacity onPress={disabled ? undefined : onPress} style={[
            {
                backgroundColor: '#000',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
            },
            disabled && {
                opacity: 0.5,
            },
            style   
        ]} disabled={disabled}>
            <TextMalet style={{ fontSize: 16, color: '#f4f4f5' }}>{text}</TextMalet>
        </TouchableOpacity>
    )
}