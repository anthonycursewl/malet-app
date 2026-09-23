import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import ModalOptions from '@/components/shared/ModalOptions';
import TextMalet from '@/components/TextMalet/TextMalet';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/shared/theme/colors';

export type ChartFilterKey = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semestral' | 'yearly' | 'custom';

export interface ChartFilterOption {
  key: ChartFilterKey;
  label: string;
  shortLabel: string;
}

export interface ChartFilterResult {
  key: ChartFilterKey;
  from?: string;
  to?: string;
}

const FILTER_OPTIONS: ChartFilterOption[] = [
  { key: 'daily', label: 'Diario', shortLabel: 'D' },
  { key: 'weekly', label: 'Semanal', shortLabel: 'S' },
  { key: 'monthly', label: 'Mensual', shortLabel: 'M' },
  { key: 'quarterly', label: 'Trimestral', shortLabel: 'T' },
  { key: 'semestral', label: 'Semestral', shortLabel: 'S' },
  { key: 'yearly', label: 'Anual', shortLabel: 'A' },
];

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHIP_WIDTH = (SCREEN_WIDTH - 80) / 3;

interface ChartFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: ChartFilterResult) => void;
  currentFilter: ChartFilterKey;
  customFrom?: string;
  customTo?: string;
}

export default function ChartFilterModal({
  visible,
  onClose,
  onSelect,
  currentFilter,
  customFrom,
  customTo,
}: ChartFilterModalProps) {
  const [selected, setSelected] = useState<ChartFilterKey>(currentFilter);
  const [showCustom, setShowCustom] = useState(currentFilter === 'custom');

  const today = new Date();

  const [fromYear, setFromYear] = useState(() => customFrom ? parseInt(customFrom.slice(0, 4)) : today.getFullYear() - 1);
  const [fromMonth, setFromMonth] = useState(() => customFrom ? parseInt(customFrom.slice(5, 7)) : today.getMonth() + 1);
  const [toYear, setToYear] = useState(() => customTo ? parseInt(customTo.slice(0, 4)) : today.getFullYear());
  const [toMonth, setToMonth] = useState(() => customTo ? parseInt(customTo.slice(5, 7)) : today.getMonth() + 1);

  const customRangeError = useMemo(() => {
    if (selected !== 'custom') return null;
    const from = new Date(fromYear, fromMonth - 1, 1);
    const to = new Date(toYear, toMonth - 1, 1);
    if (from > to) return 'La fecha inicio debe ser anterior a la fecha final';
    const diffMonths = (toYear - fromYear) * 12 + (toMonth - fromMonth);
    if (diffMonths > 60) return 'El rango no puede superar 5 años';
    return null;
  }, [selected, fromYear, fromMonth, toYear, toMonth]);

  const handleSelect = (key: ChartFilterKey) => {
    setSelected(key);
    setShowCustom(false);
    onSelect({ key });
    onClose();
  };

  const handleShowCustom = () => {
    setSelected('custom');
    setShowCustom(true);
  };

  const handleApplyCustom = () => {
    if (customRangeError) return;
    const from = `${fromYear}-${String(fromMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(toYear, toMonth, 0).getDate();
    const to = `${toYear}-${String(toMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    onSelect({ key: 'custom', from, to });
    onClose();
  };

  return (
    <ModalOptions visible={visible} onClose={onClose} heightRatio={showCustom ? 0.85 : 0.5}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Calendar size={18} color={colors.common.malet} />
          <TextMalet style={styles.title}>Período del gráfico</TextMalet>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {FILTER_OPTIONS.map((opt) => {
              const isActive = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => handleSelect(opt.key)}
                  activeOpacity={0.7}
                >
                  <TextMalet style={[styles.chipShort, isActive && styles.chipShortActive]}>
                    {opt.shortLabel}
                  </TextMalet>
                  <TextMalet style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                    {opt.label}
                  </TextMalet>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.customBtn, selected === 'custom' && styles.customBtnActive]}
            onPress={handleShowCustom}
            activeOpacity={0.7}
          >
            <Calendar size={15} color={selected === 'custom' ? colors.common.white : colors.common.malet} />
            <TextMalet style={[styles.customBtnText, selected === 'custom' && styles.customBtnTextActive]}>
              Rango personalizado
            </TextMalet>
          </TouchableOpacity>

          {showCustom && (
            <View style={styles.customSection}>
              <View style={styles.dateGroup}>
                <TextMalet style={styles.dateLabel}>Desde</TextMalet>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
                  {YEARS.map((y) => (
                    <TouchableOpacity
                      key={`fy-${y}`}
                      style={[styles.pill, fromYear === y && styles.pillActive]}
                      onPress={() => setFromYear(y)}
                      activeOpacity={0.7}
                    >
                      <TextMalet style={[styles.pillText, fromYear === y && styles.pillTextActive]}>{y}</TextMalet>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
                  {MONTHS.map((m) => (
                    <TouchableOpacity
                      key={`fm-${m}`}
                      style={[styles.pill, fromMonth === m && styles.pillActive]}
                      onPress={() => setFromMonth(m)}
                      activeOpacity={0.7}
                    >
                      <TextMalet style={[styles.pillText, fromMonth === m && styles.pillTextActive]}>
                        {MONTH_NAMES[m - 1]}
                      </TextMalet>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateDivider}>
                <View style={styles.dividerLine} />
                <ChevronRight size={14} color={colors.grey[400]} />
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.dateGroup}>
                <TextMalet style={styles.dateLabel}>Hasta</TextMalet>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
                  {YEARS.map((y) => (
                    <TouchableOpacity
                      key={`ty-${y}`}
                      style={[styles.pill, toYear === y && styles.pillActive]}
                      onPress={() => setToYear(y)}
                      activeOpacity={0.7}
                    >
                      <TextMalet style={[styles.pillText, toYear === y && styles.pillTextActive]}>{y}</TextMalet>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
                  {MONTHS.map((m) => (
                    <TouchableOpacity
                      key={`tm-${m}`}
                      style={[styles.pill, toMonth === m && styles.pillActive]}
                      onPress={() => setToMonth(m)}
                      activeOpacity={0.7}
                    >
                      <TextMalet style={[styles.pillText, toMonth === m && styles.pillTextActive]}>
                        {MONTH_NAMES[m - 1]}
                      </TextMalet>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {customRangeError ? (
                <View style={styles.errorContainer}>
                  <TextMalet style={styles.errorText}>{customRangeError}</TextMalet>
                </View>
              ) : (
                <View style={styles.previewContainer}>
                  <TextMalet style={styles.previewText}>
                    {MONTH_NAMES_FULL[fromMonth - 1]} {fromYear} → {MONTH_NAMES_FULL[toMonth - 1]} {toYear}
                  </TextMalet>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {showCustom && (
          <View style={styles.stickyFooter}>
            <TouchableOpacity
              style={[styles.applyBtn, !!customRangeError && styles.applyBtnDisabled]}
              onPress={handleApplyCustom}
              disabled={!!customRangeError}
              activeOpacity={0.7}
            >
              <TextMalet style={styles.applyBtnText}>Aplicar rango</TextMalet>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ModalOptions>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.common.malet,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: CHIP_WIDTH,
    backgroundColor: colors.grey[100],
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.common.malet,
    borderColor: colors.common.malet,
  },
  chipShort: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.grey[300],
    marginBottom: 2,
  },
  chipShortActive: {
    color: colors.common.white,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.grey[500],
  },
  chipLabelActive: {
    color: colors.grey[300],
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.grey[300],
    backgroundColor: colors.grey[100],
  },
  customBtnActive: {
    backgroundColor: colors.common.malet,
    borderColor: colors.common.malet,
  },
  customBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.common.malet,
  },
  customBtnTextActive: {
    color: colors.common.white,
  },
  customSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey[200],
    gap: 12,
  },
  dateGroup: {
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grey[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContent: {
    gap: 6,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.common.malet,
    borderColor: colors.common.malet,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey[600],
  },
  pillTextActive: {
    color: colors.common.white,
    fontWeight: '700',
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grey[200],
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error.main,
  },
  previewContainer: {
    backgroundColor: colors.grey[100],
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.grey[200],
    alignItems: 'center',
  },
  previewText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.common.malet,
  },
  stickyFooter: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  applyBtn: {
    backgroundColor: colors.common.malet,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.35,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.common.white,
  },
});
