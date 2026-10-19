import { ActivityIndicator, StyleSheet, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

/**
 * Velo con spinner mientras se elimina algo (venta, recibo, ...).
 * Bloquea la pantalla para que no se pueda tocar nada mientras corre.
 */
export default function DeletingOverlay({
    visible,
    label = 'Eliminando…',
}: {
    visible: boolean;
    label?: string;
}) {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <ActivityIndicator size="small" color="#111" />
                <TextMalet style={styles.label}>{label}</TextMalet>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(255,255,255,0.82)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    label: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
    },
});
