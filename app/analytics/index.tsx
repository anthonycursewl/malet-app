import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import LineChart from '@/components/Analytics/LineChart';
import TagDistribution from '@/components/Analytics/TagDistribution';
import SummaryCard from '@/components/Analytics/SummaryCard';
import ChartFilterModal, { ChartFilterKey } from '@/components/Analytics/ChartFilterModal';
import { SkeletonSummaryCard, SkeletonChart, SkeletonTags } from '@/components/Analytics/Skeletons';
import ModalAccounts from '@/components/Modals/ModalAccounts/ModalAccounts';
import { useAnalyticsStore } from '@/shared/stores/useAnalyticsStore';
import { useAccountStore } from '@/shared/stores/useAccountStore';
import { getCurrencyIcon } from '@/shared/services/currency/currencyService';
import { colors } from '@/shared/theme/colors';
import { Wallet, TrendingDown, TrendingUp, ArrowRightLeft, Tag } from 'lucide-react-native';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const FILTER_LABELS: Record<ChartFilterKey, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  yearly: 'Anual',
  custom: 'Rango',
};

function getFilterDateRange(key: ChartFilterKey, monthDate: Date): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  switch (key) {
    case 'daily': {
      const d = new Date(year, month - 1, 1);
      const from = d.toISOString().slice(0, 10);
      return { from, to: monthEnd };
    }
    case 'weekly': {
      const d = new Date(year, month - 1, 1);
      const from = d.toISOString().slice(0, 10);
      return { from, to: monthEnd };
    }
    case 'monthly':
      return { from: monthStart, to: monthEnd };
    case 'quarterly': {
      const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
      const qStart = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
      const qLastDay = new Date(year, quarterStartMonth + 2, 0).getDate();
      const qEnd = `${year}-${String(quarterStartMonth + 2).padStart(2, '0')}-${String(qLastDay).padStart(2, '0')}`;
      return { from: qStart, to: qEnd };
    }
    case 'semestral': {
      const halfStartMonth = month <= 6 ? 1 : 7;
      const hStart = `${year}-${String(halfStartMonth).padStart(2, '0')}-01`;
      const hLastDay = new Date(year, halfStartMonth + 5, 0).getDate();
      const hEnd = `${year}-${String(halfStartMonth + 5).padStart(2, '0')}-${String(hLastDay).padStart(2, '0')}`;
      return { from: hStart, to: hEnd };
    }
    case 'yearly':
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case 'custom':
      return { from: monthStart, to: monthEnd };
  }
}

function formatCurrency(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [chartFilter, setChartFilter] = useState<ChartFilterKey>('monthly');
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    loadingSummary,
    loadingChart,
    loadingTags,
    summary,
    daily,
    tags,
    fetchSummary,
    fetchRange,
    fetchTags,
  } = useAnalyticsStore();

  const selectedAccount = useAccountStore((s) => s.selectedAccount);

  const dateRange = useMemo(() => {
    const monthRange = {
      from: `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-01`,
      to: `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()).padStart(2, '0')}`,
    };
    return monthRange;
  }, [selectedMonth]);

  const chartDateRange = useMemo(() => {
    if (chartFilter === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getFilterDateRange(chartFilter, selectedMonth);
  }, [chartFilter, selectedMonth, customFrom, customTo]);

  const loadData = useCallback(async () => {
    const accountFilter = selectedAccount ? { account_id: selectedAccount.id } : undefined;
    await Promise.all([
      fetchSummary({ ...accountFilter, ...dateRange }),
      fetchRange({ ...accountFilter, ...chartDateRange }, { sort_by: 'date', order: 'asc', limit: 366 }),
      fetchTags({ ...accountFilter, ...dateRange }, { sort_by: 'total', order: 'desc', limit: 10 }),
    ]);
    setHasLoaded(true);
  }, [selectedAccount, dateRange, chartDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth();
  }, [selectedMonth]);

  const monthLabel = `${MONTH_NAMES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;

  const handleFilterSelect = useCallback((result: { key: ChartFilterKey; from?: string; to?: string }) => {
    setChartFilter(result.key);
    if (result.key === 'custom' && result.from && result.to) {
      setCustomFrom(result.from);
      setCustomTo(result.to);
    }
  }, []);

  const chartData = useMemo(() => {
    return daily.map((p: any) => ({
      label: p.date ? new Date(p.date + 'T00:00:00').getDate().toString() : '',
      value: p.total,
    }));
  }, [daily]);

  const chartWidth = Dimensions.get('window').width - 48;

  const isLoadingSummary = loadingSummary && !hasLoaded;
  const isLoadingChart = loadingChart;
  const isLoadingTags = loadingTags && !hasLoaded;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <TextMalet style={styles.headerTitle}>Analíticas</TextMalet>
        <View style={styles.backBtn} />
      </View>

      {/* Account Selector */}
      <TouchableOpacity
        style={styles.accountSelector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedAccount && (
          <Image
            source={{ uri: getCurrencyIcon(selectedAccount.currency) }}
            style={styles.accountSelectorIcon}
          />
        )}
        <TextMalet style={styles.accountSelectorLabel} numberOfLines={1}>
          {selectedAccount?.name || 'Todas las cuentas'}
        </TextMalet>
        <ChevronDown size={14} color="rgba(0,0,0,0.4)" />
      </TouchableOpacity>

      <ModalAccounts visible={modalVisible} onClose={() => setModalVisible(false)} />
      <ChartFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSelect={handleFilterSelect}
        currentFilter={chartFilter}
        customFrom={customFrom}
        customTo={customTo}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.main} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector */}
        <FadeInSection delay={0}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
              <ChevronLeft size={20} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
            <TextMalet style={styles.monthLabel}>{monthLabel}</TextMalet>
            {isCurrentMonth ? (
              <View style={styles.monthArrow} />
            ) : (
              <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
                <ChevronRight size={20} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </FadeInSection>

        {/* Summary Cards */}
        {isLoadingSummary ? (
          <View style={styles.summaryRow}>
            <SkeletonSummaryCard position="left" />
            <SkeletonSummaryCard position="right" />
          </View>
        ) : summary ? (
          <>
            <FadeInSection delay={60}>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label="Egreso"
                  amount={summary.total_spent}
                  color={colors.error.main}
                  icon={<TrendingDown size={14} color={colors.error.main} />}
                  position="left"
                />
                <SummaryCard
                  label="Ingreso"
                  amount={summary.total_saved}
                  color={colors.success.main}
                  icon={<TrendingUp size={14} color={colors.success.main} />}
                  position="right"
                />
              </View>
            </FadeInSection>
            <FadeInSection delay={120}>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label="Flujo neto"
                  amount={summary.net_flow}
                  color={summary.net_flow >= 0 ? colors.success.main : colors.error.main}
                  icon={<ArrowRightLeft size={14} color={colors.text.secondary} />}
                  position="left"
                />
                <SummaryCard
                  label="Transacciones"
                  amount={summary.transaction_count}
                  icon={<Wallet size={14} color={colors.primary.main} />}
                  position="right"
                  format="integer"
                />
              </View>
            </FadeInSection>
          </>
        ) : null}

        {/* Chart */}
        <FadeInSection delay={isLoadingSummary ? 200 : 180}>
          <View style={styles.section}>
            <View style={styles.chartHeader}>
              <TextMalet style={styles.sectionTitle}>Tendencia</TextMalet>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setFilterModalVisible(true)}
                activeOpacity={0.7}
              >
                <SlidersHorizontal size={14} color="rgba(0,0,0,0.5)" />
                <TextMalet style={styles.filterBtnText}>{FILTER_LABELS[chartFilter]}</TextMalet>
              </TouchableOpacity>
            </View>
            <View style={styles.chartContainer}>
              {isLoadingSummary || isLoadingChart ? (
                <SkeletonChart />
              ) : (
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={180}
                  lineColor={colors.primary.main}
                  formatValue={formatCurrency}
                />
              )}
            </View>
          </View>
        </FadeInSection>

        {/* Tags Distribution */}
        <FadeInSection delay={isLoadingSummary ? 300 : 260}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={16} color={colors.text.secondary} />
              <TextMalet style={styles.sectionTitle}>Por categorías</TextMalet>
            </View>
            {isLoadingSummary || isLoadingTags ? (
              <SkeletonTags />
            ) : (
              <TagDistribution tags={tags} />
            )}
          </View>
        </FadeInSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.default,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    maxWidth: 220,
  },
  accountSelectorIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  accountSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.common.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  monthArrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  section: {
    backgroundColor: colors.common.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.55)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  chartContainer: {
    marginTop: 4,
  },
});
