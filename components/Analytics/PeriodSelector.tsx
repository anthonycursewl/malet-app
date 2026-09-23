import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TextMalet from '@/components/TextMalet/TextMalet';
import { colors } from '@/shared/theme/colors';

interface PeriodOption {
  key: string;
  label: string;
}

interface PeriodSelectorProps {
  options: PeriodOption[];
  active: string;
  onSelect: (key: string) => void;
}

export default function PeriodSelector({ options, active, onSelect }: PeriodSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {options.map((opt) => {
          const isActive = active === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(opt.key)}
              activeOpacity={0.7}
            >
              <TextMalet
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {opt.label}
              </TextMalet>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <LinearGradient
        colors={['transparent', colors.common.white]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeRight}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.common.black,
    borderColor: colors.common.black,
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.45)',
  },
  chipTextActive: {
    color: colors.common.white,
    fontWeight: '600',
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 32,
  },
});
