import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
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
}

export const InputField = memo(({
  label,
  placeholder,
  value,
  onChangeText,
  onPress,
  error,
  editable = true,
  icon
}: InputFieldProps) => {
  const content = (
    <View style={[
      styles.fieldContainer,
      error ? styles.fieldError : null,
      value ? styles.fieldActive : null,
    ]}>
      <TextMalet style={styles.fieldLabel}>{label}</TextMalet>
      <View style={styles.fieldRow}>
        {onPress ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon && icon}
            <TextMalet style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
              {value || placeholder}
            </TextMalet>
          </View>
        ) : (
          <TextInput
            style={styles.fieldInput}
            placeholder={placeholder}
            placeholderTextColor={THEME.textTertiary}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            selectionColor={THEME.accent}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.fieldWrapper}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      ) : content}
      {error && <TextMalet style={styles.errorText}>{error}</TextMalet>}
    </View>
  );
});
