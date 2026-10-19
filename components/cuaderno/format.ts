import { SalesDatePreset, SeriesPeriod, StoreCurrency } from '@/shared/entities/SalesModule';
import { useToastStore } from '@/shared/stores/useToastStore';

/** Formato monetario en la moneda de la tienda: "Bs 1.234,56". */
export const formatMoney = (value: number, currency: StoreCurrency = 'Bs'): string =>
    `${currency} ${Number(value ?? 0).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

/** Formato compacto para ejes de gráficos. */
export const formatMoneyCompact = (value: number, currency: StoreCurrency = 'Bs'): string => {
    const v = Number(value ?? 0);
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 10_000) return `${currency} ${(v / 1000).toFixed(1)}K`;
    return formatMoney(v, currency);
};

/** Moneda de la tienda actual (los montos siempre se muestran en ella, sin conversión). */
export const currencyOf = (
    store: { currency?: StoreCurrency } | null | undefined
): StoreCurrency => store?.currency ?? 'Bs';

/** Fecha/hora corta de una venta: "23 sep · 14:35". */
export const formatSaleDate = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d
        .toLocaleString('es-VE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
        .replace(',', ' ·');
};

/** Fecha corta tipo picker: "23/09/2026". */
export const formatDateShort = (d: Date): string =>
    d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Etiqueta de bucket de la serie según el periodo. */
export const formatBucketLabel = (bucket: string, period: SeriesPeriod): string => {
    const d = new Date(bucket);
    if (Number.isNaN(d.getTime())) return '';
    if (period === 'month') return d.toLocaleDateString('es-VE', { month: 'short' });
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

/** 'YYYY-MM-DD' en zona horaria local (un `to` date-only incluye todo el día). */
export const toISODate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Segundos restantes hasta una fecha (mínimo 0). */
export const secondsUntil = (iso?: string): number => {
    if (!iso) return 0;
    const ms = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
};

/** Chips de rango predefinidos del contrato. */
export const PRESET_OPTIONS: { value: SalesDatePreset; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'this_week', label: 'Semana' },
    { value: 'last_week', label: 'Sem. pasada' },
    { value: 'this_month', label: 'Mes' },
    { value: 'last_month', label: 'Mes pasada' },
    { value: 'last_7_days', label: '7 días' },
    { value: 'last_30_days', label: '30 días' },
    { value: 'this_year', label: 'Año' },
];

/** Toast informativo/error (patrón de feedback de la app). */
export const notify = (type: 'success' | 'error' | 'info', message: string): void => {
    useToastStore.getState().add({ type, message, duration: 3000 });
};

/** Toast de éxito con acción "Deshacer" (para soft-deletes). */
export const notifyUndo = (message: string, onUndo: () => void): void => {
    useToastStore.getState().add({
        type: 'success',
        message,
        duration: 5000,
        actionLabel: 'Deshacer',
        onAction: onUndo,
    });
};
