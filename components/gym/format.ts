/**
 * Formato y avisos del módulo Gym.
 * `notify` se reexporta para que el módulo tenga un único punto de importación.
 */
export { notify } from '@/components/cuaderno/format';

/** Volumen en kg con separador de miles y sin decimales innecesarios. */
export function formatVolume(value: number): string {
    const rounded = Math.round(value);
    return `${rounded.toLocaleString('es-VE')} kg`;
}

/** Peso de un set (`kg`). */
export function formatWeight(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${Number(value) % 1 === 0 ? Number(value) : Number(value).toFixed(1)} kg`;
}

/** Duración en minutos a `1h 05m` / `45 min`. */
export function formatDuration(minutes: number | null | undefined): string {
    if (minutes == null || minutes <= 0) return '—';
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    if (hours === 0) return `${rest} min`;
    return `${hours}h ${String(rest).padStart(2, '0')}m`;
}

/** Adherencia (`0.82` → `82 %`). */
export function formatAdherence(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${Math.round(value * 100)} %`;
}

/** Fecha corta de un entrenamiento (`YYYY-MM-DD` → `19 oct`). */
export function formatWorkoutDate(value: string | Date): string {
    const iso = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1, day ?? 1);
    return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

/** Número desde un texto de input (`''` → null, acepta coma decimal). */
export function parseNumberInput(value: string): number | null {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
