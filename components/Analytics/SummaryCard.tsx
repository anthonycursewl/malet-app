import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { colors } from '@/shared/theme/colors';

interface SummaryCardProps {
  label: string;
  amount: number;
  color?: string;
  icon?: React.ReactNode;
  position?: 'left' | 'right';
  format?: 'currency' | 'integer';
}

export default function SummaryCard({ label, amount, color, icon, position, format = 'currency' }: SummaryCardProps) {
  const formatted = format === 'integer'
    ? Math.round(Math.abs(amount)).toLocaleString('en')
    : `$${Math.abs(amount).toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  const cardStyle: ViewStyle[] = [styles.card];
  if (position === 'left') {
    cardStyle.push(styles.cardLeft);
  } else if (position === 'right') {
    cardStyle.push(styles.cardRight);
  }

  return (
    <View style={cardStyle}>
      <View style={styles.header}>
        {icon}
        <TextMalet style={styles.label}>{label}</TextMalet>
      </View>
      <TextMalet style={[styles.amount, color ? { color } : undefined]}>
        {amount < 0 ? '-' : ''}{formatted}
      </TextMalet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.common.white,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderStyle: 'dashed',
  },
  cardLeft: {
    borderRightWidth: 0,
  },
  cardRight: {
    borderLeftWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
