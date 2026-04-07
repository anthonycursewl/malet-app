import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { headerStyles as styles } from './add.styles';

interface AnimatedHeaderProps {
  onBack: () => void;
  title: string;
}

export const AnimatedHeader = memo(({ onBack, title }: AnimatedHeaderProps) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <TextMalet style={styles.backIcon}>←</TextMalet>
    </TouchableOpacity>
    <TextMalet style={styles.headerTitle}>{title}</TextMalet>
    <View style={styles.headerRightPlaceholder} />
  </View>
));
