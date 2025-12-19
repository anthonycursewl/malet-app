import { KeyboardTypeOptions, TextInput, TextStyle } from "react-native";

// Valid autoComplete values for React Native TextInput
type AutoCompleteType =
    | 'off' | 'username' | 'password' | 'email' | 'name' | 'tel' | 'street-address'
    | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year'
    | 'birthdate-day' | 'birthdate-full' | 'birthdate-month' | 'birthdate-year'
    | 'gender' | 'name-family' | 'name-given' | 'name-middle' | 'name-middle-initial'
    | 'name-prefix' | 'name-suffix' | 'nickname' | 'one-time-code' | 'organization'
    | 'organization-title' | 'password-new' | 'sms-otp' | 'tel-country-code'
    | 'tel-device' | 'tel-national' | 'url' | 'username-new';

interface InputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    style?: TextStyle;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: AutoCompleteType;
    editable?: boolean;
}

export default function Input({ placeholder = "", value = "", onChangeText, style, secureTextEntry, keyboardType, autoCapitalize, autoComplete, editable = true }: InputProps) {
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
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