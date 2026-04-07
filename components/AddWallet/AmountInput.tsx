import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { TextInput, View } from 'react-native';
import { amountStyles as styles } from './add.styles';
import { THEME } from './theme';

interface AmountInputProps {
  amount: string;
  onChangeAmount: (value: string) => void;
  error?: string;
}

export const AmountInput = memo(({ amount, onChangeAmount, error }: AmountInputProps) => {
  const parseAmount = (val: string) => {
    if (!val) return { integer: '', decimal: '' };
    const normalized = val.replace(',', '.');
    const parts = normalized.split('.');
    return { integer: parts[0] || '', decimal: parts[1] || '' };
  };

  const { integer, decimal } = parseAmount(amount);

  const handleIntegerChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    onChangeAmount(decimal ? `${cleanText}.${decimal}` : cleanText);
  };

  const handleDecimalChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, 2);
    onChangeAmount(integer ? `${integer}.${cleanText}` : `0.${cleanText}`);
  };

  return (
    <View style={styles.amountContainer}>
      <TextMalet style={styles.labelSmall}>MONTO</TextMalet>
      <View style={styles.amountInputRow}>
        <TextMalet style={styles.currencySymbol}>$</TextMalet>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          value={integer}
          onChangeText={handleIntegerChange}
          placeholderTextColor="#D4D4D4"
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
          selectionColor={THEME.accent}
        />
        <TextMalet style={styles.decimalDot}>.</TextMalet>
        <TextInput
          style={styles.decimalInput}
          placeholder="00"
          value={decimal}
          onChangeText={handleDecimalChange}
          placeholderTextColor="#CCCCCC"
          keyboardType="number-pad"
          maxLength={2}
          selectionColor={THEME.accent}
        />
      </View>
      {error && <TextMalet style={styles.errorTextCenter}>{error}</TextMalet>}
    </View>
  );
});
