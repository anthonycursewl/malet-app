import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

/**
 * Título de sección con su icono: mismo estilo en todos los apartados del
 * módulo de ventas (Ventas, Recibos, Productos, ...).
 */
export default function SectionTitle({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.row}>
            <Icon size={14} color="rgba(0,0,0,0.55)" />
            <TextMalet style={styles.text}>{children}</TextMalet>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
});
