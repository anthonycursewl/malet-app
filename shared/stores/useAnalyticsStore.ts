import { create } from 'zustand';
import {
  analyticsService,
  AnalyticsSummary,
  DailyPoint,
  WeeklyPoint,
  MonthlyPoint,
  QuarterlyPoint,
  YearlyPoint,
  TagBreakdown,
  PeriodicFilters,
  DateRangeFilters,
  AnalyticsQueryOptions,
} from '../services/wallet/analytics.service';

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface AnalyticsState {
  loadingSummary: boolean;
  loadingChart: boolean;
  loadingTags: boolean;
  error: string | null;

  summary: AnalyticsSummary | null;
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  monthly: MonthlyPoint[];
  quarterly: QuarterlyPoint[];
  yearly: YearlyPoint[];
  tags: TagBreakdown[];

  activePeriod: AnalyticsPeriod;
  setActivePeriod: (period: AnalyticsPeriod) => void;

  fetchSummary: (filters?: DateRangeFilters) => Promise<void>;
  fetchPeriod: (
    period: AnalyticsPeriod,
    filters?: PeriodicFilters,
    options?: AnalyticsQueryOptions,
  ) => Promise<void>;
  fetchTags: (filters?: DateRangeFilters, options?: AnalyticsQueryOptions) => Promise<void>;
  fetchRange: (filters: DateRangeFilters, options?: AnalyticsQueryOptions) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE = {
  loadingSummary: false,
  loadingChart: false,
  loadingTags: false,
  error: null,
  summary: null,
  daily: [],
  weekly: [],
  monthly: [],
  quarterly: [],
  yearly: [],
  tags: [],
  activePeriod: 'monthly' as AnalyticsPeriod,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ...INITIAL_STATE,

  setActivePeriod: (period) => set({ activePeriod: period }),

  fetchSummary: async (filters) => {
    set({ loadingSummary: true, error: null });
    const { response, error } = await analyticsService.getSummary(filters);
    if (error) {
      set({ error, loadingSummary: false });
      return;
    }
    set({ summary: response, loadingSummary: false });
  },

  fetchPeriod: async (period, filters, options) => {
    set({ loadingChart: true, error: null });

    const fetchers = {
      daily: () => analyticsService.getDaily(filters, options),
      weekly: () => analyticsService.getWeekly(filters, options),
      monthly: () => analyticsService.getMonthly(filters, options),
      quarterly: () => analyticsService.getQuarterly(filters, options),
      yearly: () => analyticsService.getYearly(filters, options),
    };

    const { response, error } = await fetchers[period]();
    if (error) {
      set({ error, loadingChart: false });
      return;
    }

    const key = period;
    set({ [key]: response ?? [], loadingChart: false } as any);
  },

  fetchTags: async (filters, options) => {
    set({ loadingTags: true, error: null });
    const { response, error } = await analyticsService.getByTags(filters, options);
    if (error) {
      set({ error, loadingTags: false });
      return;
    }
    set({ tags: response ?? [], loadingTags: false });
  },

  fetchRange: async (filters, options) => {
    set({ loadingChart: true, error: null });
    const { response, error } = await analyticsService.getByRange(filters, options);
    if (error) {
      set({ error, loadingChart: false });
      return;
    }
    set({ daily: response ?? [], loadingChart: false });
  },

  reset: () => set(INITIAL_STATE),
}));
