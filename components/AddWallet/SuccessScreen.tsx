import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import IconVerified from '@/svgs/common/IconVerified';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { THEME } from './theme';

export interface SuccessData {
  name: string;
  amount: string;
  type: 'expense' | 'saving' | 'pending_payment';
  accountName: string;
  tagCount: number;
}

interface SuccessScreenProps {
  data: SuccessData;
  onAddAnother: () => void;
}

export const SuccessScreen = ({ data, onAddAnother }: SuccessScreenProps) => {
  const router = useRouter();

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      // 1. Check icon bounces in
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(checkRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 2. Details fade in
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // 3. Footer slides in
      Animated.parallel([
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(footerTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const isExpense = data.type === 'expense';
  const isSaving = data.type === 'saving';
  const isPending = data.type === 'pending_payment';

  const typeColor = isExpense ? '#FF6B6B' : isSaving ? '#51CF66' : '#F5C842';
  const typeBg = isExpense ? '#FFF5F5' : isSaving ? '#F0FFF4' : '#FFF9E6';
  const typeLabel = isExpense ? 'Egreso' : isSaving ? 'Ingreso' : 'Pago Pendiente';
  const typeIcon = isExpense ? 'arrow-upward' : isSaving ? 'arrow-downward' : 'schedule';

  const gradientColors = isExpense
    ? ['rgba(255, 82, 82, 0.12)', 'rgba(255, 82, 82, 0)'] as const
    : isSaving
      ? ['rgba(120, 255, 165, 0.12)', 'rgba(141, 255, 184, 0)'] as const
      : ['rgba(245, 200, 66, 0.12)', 'rgba(245, 200, 66, 0)'] as const;

  const rotateInterpolate = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={gradientColors}
        style={s.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Hero */}
      <View style={s.hero}>
        <Animated.View style={[
          { transform: [{ scale: checkScale }, { rotate: rotateInterpolate }] },
        ]}>
          <IconVerified width={40} height={40} fill={typeColor} style={{ marginBottom: 10 }} />
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
          <TextMalet style={s.successTitle}>¡Transacción registrada!</TextMalet>
          <TextMalet style={s.successSubtitle}>Tu movimiento ha sido guardado correctamente.</TextMalet>
        </Animated.View>
      </View>

      {/* Details card */}
      <Animated.View style={[s.card, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
        {/* Amount */}
        <View style={s.amountRow}>
          <TextMalet style={[s.amountSign, { color: typeColor }]}>
            {isExpense ? '-' : isPending ? '' : '+'}
          </TextMalet>
          <TextMalet style={s.amountValue}>${data.amount}</TextMalet>
        </View>

        <View style={s.divider} />

        {/* Detail rows */}
        <DetailRow icon="description" label="Descripción" value={data.name} />
        <DetailRow icon={typeIcon as any} label="Tipo" value={typeLabel} valueColor={typeColor} />
        <DetailRow icon="account-balance" label="Cuenta" value={data.accountName} />
        {data.tagCount > 0 && (
          <DetailRow icon="local-offer" label="Etiquetas" value={`${data.tagCount} etiqueta${data.tagCount > 1 ? 's' : ''}`} />
        )}

        <View style={{ height: 10 }} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Footer */}
      <Animated.View style={[s.footer, { opacity: footerOpacity, transform: [{ translateY: footerTranslateY }] }]}>
        <Button
          text="Agregar otra transacción"
          onPress={onAddAnother}
          style={s.addButton}
        />
        <TouchableOpacity onPress={() => router.back()} style={s.doneButton}>
          <TextMalet style={s.doneText}>Volver al inicio</TextMalet>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Detail Row ────────────────────────────────────────
const DetailRow = ({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={s.detailRow}>
    <View style={s.detailLeft}>
      <MaterialIcons name={icon} size={18} color={THEME.textTertiary} />
      <TextMalet style={s.detailLabel}>{label}</TextMalet>
    </View>
    <TextMalet style={[s.detailValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
      {value}
    </TextMalet>
  </View>
);

// ─── Styles ────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 150,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  checkCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 14,
    color: THEME.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 32,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 18,
  },
  amountSign: {
    fontSize: 28,
    fontWeight: '600',
    marginRight: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -1,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    borderStyle: 'dashed',
    marginVertical: 16,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: THEME.textTertiary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    maxWidth: '50%',
  },

  // Footer
  footer: {
    gap: 12,
  },
  addButton: {
    backgroundColor: THEME.text,
    borderRadius: 16,
    minHeight: 52,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textTertiary,
  },
});
