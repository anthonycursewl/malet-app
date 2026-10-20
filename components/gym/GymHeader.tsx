import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

interface GymHeaderProps {
    title: string;
    subtitle?: string;
    /** Acción o indicador a la derecha (p. ej. el temporizador). */
    right?: ReactNode;
    onBack?: () => void;
}

/** Cabecera de las pantallas del gimnasio: volver + título. */
export default function GymHeader({ title, subtitle, right, onBack }: GymHeaderProps) {
    const goBack =
        onBack ??
        (() => (router.canGoBack() ? router.back() : router.replace('/dashboard' as any)));

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={goBack}
                style={styles.back}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
            >
                <ChevronLeft size={24} color="#1f1f1f" />
            </TouchableOpacity>

            <View style={styles.texts}>
                <TextMalet style={styles.title} numberOfLines={1}>
                    {title}
                </TextMalet>
                {subtitle ? (
                    <TextMalet style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </TextMalet>
                ) : null}
            </View>

            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 2,
        paddingBottom: 12,
    },
    back: {
        padding: 8,
        marginLeft: -8,
        marginRight: 4,
    },
    texts: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
});
