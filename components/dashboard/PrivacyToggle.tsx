import { Eye, EyeOff } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface PrivacyToggleProps {
    hidden: boolean;
    onPress: () => void;
}

/** Botón simple: fondo blanco con baja opacidad, sin capas de vidrio. */
export default function PrivacyToggle({
    hidden,
    onPress,
}: PrivacyToggleProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.button}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={
                hidden
                    ? 'Mostrar datos de transacciones'
                    : 'Ocultar datos de transacciones'
            }
        >
            {hidden ? (
                <EyeOff size={16} color="#4b5563" strokeWidth={2} />
            ) : (
                <Eye size={16} color="#4b5563" strokeWidth={2} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
});
