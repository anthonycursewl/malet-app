import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import TextMalet from '../TextMalet/TextMalet';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export const LoadingOverlay = ({ visible, message }: LoadingOverlayProps) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                {message && (
                    <TextMalet style={styles.message}>{message}</TextMalet>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    content: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
    },
    message: {
        color: colors.text.secondary,
        fontSize: 14,
    },
});