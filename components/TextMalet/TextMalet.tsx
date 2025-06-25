import { StyleProp, Text, TextStyle } from "react-native";

type TextMaletStyle = StyleProp<TextStyle>;

interface TextMaletProps {
    children: React.ReactNode;
    style?: TextMaletStyle | TextMaletStyle[];
    className?: string;
}

export default function TextMalet({ children, style, className }: TextMaletProps) {
    const flattenedStyles = Array.isArray(style) 
        ? style.filter(Boolean) 
        : style || [];

    return (
        <Text 
            style={[
                { fontFamily: 'Onest' },
                ...(Array.isArray(flattenedStyles) ? flattenedStyles : [flattenedStyles])
            ]}
            className={className}
        >
            {children}
        </Text>
    )
}