import { BlurView } from 'expo-blur';
import { Eye, EyeOff } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PrivacyToggleProps {
    hidden: boolean;
    onPress: () => void;
}

/** Botón de privacidad con acabado frosted glass (blur iOS + gradiente). */
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
            <BlurView
                intensity={62}
                tint="default"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
            <View style={styles.highlight} pointerEvents="none" />
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
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.72)',
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 7,
        right: 7,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
});
