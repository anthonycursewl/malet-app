import { StyleProp, Text, TextProps, TextStyle } from "react-native";

type TextMaletStyle = StyleProp<TextStyle>;

interface TextMaletProps extends TextProps {
    children: React.ReactNode;
    style?: TextMaletStyle | TextMaletStyle[];
    className?: string;
}

export default function TextMalet({ children, style, className }: TextMaletProps) {
    const baseStyle = { fontFamily: 'Onest' };
    
    return (
        <Text 
            style={[baseStyle, style]}
            className={className}
        >
            {children}
        </Text>
    )
}