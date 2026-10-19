import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SalesDatePreset } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesPreferencesStore } from '@/shared/stores/useSalesPreferencesStore';
import { PRESET_OPTIONS, notify } from './format';

/**
 * Rango por defecto de Ventas: preferencia **personal** (por cuenta) que se
 * guarda solo en este dispositivo. Cada usuario elige la suya y no afecta a
 * los demás miembros de la tienda.
 */
export default function SalesDefaultRangeCard() {
    const user = useAuthStore((s) => s.user);
    const defaultPreset = useSalesPreferencesStore((s) => s.defaultPreset);
    const setDefaultPreset = useSalesPreferencesStore((s) => s.setDefaultPreset);

    /** Rango que se está guardando (feedback de carga en su chip). */
    const [saving, setSaving] = useState<SalesDatePreset | null>(null);

    const choose = async (preset: SalesDatePreset) => {
        if (preset === defaultPreset || saving !== null) return;

        setSaving(preset);
        const error = await setDefaultPreset(preset, user?.id);
        setSaving(null);

        if (error) {
            notify('error', error);
            return;
        }
        notify('success', 'Rango por defecto guardado.');
    };

    return (
        <View style={styles.card}>
            <View style={styles.titleRow}>
                <TextMalet style={styles.title}>Rango por defecto de Ventas</TextMalet>
                {saving !== null && <ActivityIndicator size="small" color="#111" />}
            </View>
            <TextMalet style={styles.subtitle}>
                Solo para ti: al abrir una tienda, la pestaña Ventas se filtra con este
                rango. Se guarda en este dispositivo, no en la tienda.
            </TextMalet>

            <View style={styles.chips}>
                {PRESET_OPTIONS.map((option) => {
                    const active = option.value === defaultPreset;
                    const busy = saving === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.chip,
                                active && styles.chipActive,
                                saving !== null && !busy && styles.chipDim,
                            ]}
                            onPress={() => choose(option.value)}
                            disabled={saving !== null}
                            activeOpacity={0.7}
                        >
                            <TextMalet
                                style={[
                                    styles.chipText,
                                    active && styles.chipTextActive,
                                ]}
                            >
                                {busy ? 'Guardando…' : option.label}
                            </TextMalet>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TextMalet style={styles.hint}>
                El rango elegido se aplica la próxima vez que abras la tienda; los filtros
                que cambies en Ventas no modifican esta preferencia.
            </TextMalet>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    chipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    chipDim: {
        opacity: 0.5,
    },
    chipText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    chipTextActive: {
        color: '#fff',
    },
    hint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 8,
        lineHeight: 16,
    },
});
