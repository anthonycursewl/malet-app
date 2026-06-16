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
}

export const InputField = memo(({
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
}: InputFieldProps) => {
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
    />
  );

  const content = (
    <View style={[
      styles.fieldContainer,
      error ? styles.fieldError : null,
      value ? styles.fieldActive : null,
    ]}>
      <TextMalet style={styles.fieldLabel}>{label}</TextMalet>
      <View style={styles.fieldRow}>
        {onPress ? (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {icon && icon}
            <TextMalet style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
              {value || placeholder}
            </TextMalet>
          </TouchableOpacity>
        ) : (
          inputContent
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.6} style={{ marginLeft: 8 }}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.fieldWrapper}>
      {content}
      {error && <TextMalet style={styles.errorText}>{error}</TextMalet>}
    </View>
  );
});
