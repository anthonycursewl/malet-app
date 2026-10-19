import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { KeyboardTypeOptions, TextInput, TouchableOpacity, View } from 'react-native';
import { fieldStyles as styles } from './add.styles';
import { THEME } from './theme';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  error?: string;
  editable?: boolean;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const InputField = memo(function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  onPress,
  error,
  editable = true,
  icon,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
  keyboardType,
  autoCapitalize,
}: InputFieldProps) {
  const inputContent = (
    <TextInput
      style={styles.fieldInput}
      placeholder={placeholder}
      placeholderTextColor={THEME.textTertiary}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      selectionColor={THEME.accent}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize}
    />
  );

  const content = (
    <View style={[
      styles.fieldContainer,
      error ? styles.fieldError : null,
      value ? styles.fieldActive : null,
    ]}>
      {onPress ? (
        /* Toda la caja es tocable: etiqueta, icono, texto y espacio libre. */
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <TextMalet style={styles.fieldLabel}>{label}</TextMalet>
          <View style={styles.fieldRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {icon && icon}
              <TextMalet
                style={[styles.fieldValue, !value && styles.fieldPlaceholder]}
                numberOfLines={1}
              >
                {value || placeholder}
              </TextMalet>
            </View>
            {rightIcon &&
              (onRightIconPress ? (
                <TouchableOpacity
                  onPress={onRightIconPress}
                  activeOpacity={0.6}
                  style={{ marginLeft: 8 }}
                >
                  {rightIcon}
                </TouchableOpacity>
              ) : (
                <View style={{ marginLeft: 8 }}>{rightIcon}</View>
              ))}
          </View>
        </TouchableOpacity>
      ) : (
        <>
          <TextMalet style={styles.fieldLabel}>{label}</TextMalet>
          <View style={styles.fieldRow}>
            {inputContent}
            {rightIcon &&
              (onRightIconPress ? (
                <TouchableOpacity
                  onPress={onRightIconPress}
                  activeOpacity={0.6}
                  style={{ marginLeft: 8 }}
                >
                  {rightIcon}
                </TouchableOpacity>
              ) : (
                <View style={{ marginLeft: 8 }}>{rightIcon}</View>
              ))}
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.fieldWrapper}>
      {content}
      {error && <TextMalet style={styles.errorText}>{error}</TextMalet>}
    </View>
  );
});
