import { MALET_API_URL } from '../../config/malet.config';
import { secureFetch } from '../../http/secureFetch';

export interface AnalyticsFilters {
  account_id?: string;
  type?: string;
}

export interface PeriodicFilters extends AnalyticsFilters {
  year?: number;
  month?: number;
}

export interface DateRangeFilters extends AnalyticsFilters {
  from?: string;
  to?: string;
}

export interface AnalyticsQueryOptions {
  sort_by?: string;
  order?: 'asc' | 'desc';
  limit?: number;
}

export interface TypeBreakdown {
  type: string;
  total: number;
  count: number;
}

export interface AnalyticsSummary {
  total_spent: number;
  total_saved: number;
  net_flow: number;
  transaction_count: number;
  by_type: TypeBreakdown[];
  average_per_transaction: number;
  most_active_account: { account_id: string; name: string; total: number } | null;
}

export interface DailyPoint {
  date: string;
  total: number;
  count: number;
}

export interface WeeklyPoint {
  week: string;
  total: number;
  count: number;
}

export interface MonthlyPoint {
  month: string;
  total: number;
  count: number;
}

export interface QuarterlyPoint {
  quarter: string;
  total: number;
  count: number;
}

export interface YearlyPoint {
  year: number;
  total: number;
  count: number;
}

export interface TagBreakdown {
  tag_id: string;
  tag_name: string;
  tag_color: string | null;
  type: string;
  total: number;
  count: number;
}

function buildParams(filters?: Record<string, any>, options?: AnalyticsQueryOptions): string {
  const params = new URLSearchParams();

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value != null && value !== '') {
        params.append(key, String(value));
      }
    }
  }

  if (options) {
    if (options.sort_by) params.append('sort_by', options.sort_by);
    if (options.order) params.append('order', options.order);
    if (options.limit != null) params.append('limit', String(options.limit));
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

const BASE = `${MALET_API_URL}/wallet/analytics`;

export const analyticsService = {
  async getSummary(filters?: DateRangeFilters) {
    return secureFetch<AnalyticsSummary>({
      url: `${BASE}/summary${buildParams(filters)}`,
      method: 'GET',
    });
  },

  async getDaily(filters?: PeriodicFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<DailyPoint[]>({
      url: `${BASE}/daily${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getWeekly(filters?: PeriodicFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<WeeklyPoint[]>({
      url: `${BASE}/weekly${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getMonthly(filters?: PeriodicFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<MonthlyPoint[]>({
      url: `${BASE}/monthly${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getQuarterly(filters?: PeriodicFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<QuarterlyPoint[]>({
      url: `${BASE}/quarterly${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getYearly(filters?: AnalyticsFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<YearlyPoint[]>({
      url: `${BASE}/yearly${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getByRange(filters: DateRangeFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<DailyPoint[]>({
      url: `${BASE}/range${buildParams(filters, options)}`,
      method: 'GET',
    });
  },

  async getByTags(filters?: DateRangeFilters, options?: AnalyticsQueryOptions) {
    return secureFetch<TagBreakdown[]>({
      url: `${BASE}/tags${buildParams(filters, options)}`,
      method: 'GET',
    });
  },
};
