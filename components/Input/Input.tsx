import { KeyboardTypeOptions, TextInput, TextStyle } from "react-native";

interface InputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    style?: TextStyle;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    editable?: boolean;
}

export default function Input({ placeholder = "", value = "", onChangeText, style, secureTextEntry, keyboardType, autoCapitalize, editable = true }: InputProps) {
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={editable}
            style={[
                {
                    borderWidth: 1,
                    borderColor: "#ccc",
                    backgroundColor: "rgba(241, 241, 241, 0.85)",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 15,
                    fontFamily: 'Onest',
                    color: editable ? "#000" : "#949494ff",
                },
                style
            ]} />
    )
}