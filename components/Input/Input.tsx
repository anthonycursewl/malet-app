import { KeyboardTypeOptions, TextInput, TextStyle } from "react-native";

interface InputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    style?: TextStyle;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function Input({ placeholder = "", value = "", onChangeText, style, secureTextEntry, keyboardType, autoCapitalize }: InputProps) {
    return (
        <TextInput 
        placeholder={placeholder} 
        value={value} 
        onChangeText={onChangeText} 
        secureTextEntry={secureTextEntry} 
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
            {
                borderWidth: 1,
                borderColor: "#ccc",
                backgroundColor: "rgba(241, 241, 241, 0.85)",
                borderRadius: 12,
                padding: 12,
                fontSize: 15,
                fontFamily: 'Onest',
            },
            style
        ]} />
    )
}