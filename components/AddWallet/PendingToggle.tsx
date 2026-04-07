import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { pendingStyles as styles } from './add.styles';

interface PendingToggleProps {
  isPending: boolean;
  onToggle: (value: boolean) => void;
}

export const PendingToggle = memo(({ isPending, onToggle }: PendingToggleProps) => (
  <TouchableOpacity
    style={[styles.pendingContainer, isPending && styles.pendingActive]}
    onPress={() => onToggle(!isPending)}
    activeOpacity={0.7}
  >
    <View style={[styles.pendingCheckbox, isPending && styles.pendingCheckboxActive]}>
      {isPending && <TextMalet style={styles.pendingCheck}>✓</TextMalet>}
    </View>
    <View style={styles.pendingTextContainer}>
      <TextMalet style={[styles.pendingLabel, isPending && styles.pendingLabelActive]}>
        Marcar como pendiente
      </TextMalet>
      <TextMalet style={styles.pendingHint}>El pago aún no se ha realizado</TextMalet>
    </View>
  </TouchableOpacity>
));
