import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Image, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

interface CuadernoHeaderProps {
    title: string;
    subtitle?: string;
    /** Foto del contexto (tienda): se muestra junto al título. */
    photo?: string | null;
    onBack?: () => void;
    /**
     * Padding horizontal heredado del padre (14 del SafeArea + el del contenedor de
     * la pantalla) que se compensa con margen negativo para ocupar todo el ancho y
     * se devuelve como padding interno. Por defecto 18 (14 + 4).
     */
    bleed?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Cabecera de Malet Sales: flecha de volver (solo icono) + título y subtítulo.
 * Ocupa todo el ancho de la pantalla con su propio padding interno.
 */
export default function CuadernoHeader({
    title,
    subtitle,
    photo,
    onBack,
    bleed = 18,
    style,
}: CuadernoHeaderProps) {
    const goBack =
        onBack ??
        (() => (router.canGoBack() ? router.back() : router.replace('/cuaderno' as any)));

    return (
        <View
            style={[
                styles.header,
                bleed > 0 ? { marginHorizontal: -bleed, paddingHorizontal: bleed } : null,
                style,
            ]}
        >
            <TouchableOpacity
                onPress={goBack}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
            >
                <ChevronLeft size={24} color="#1f1f1f" />
            </TouchableOpacity>

            {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            ) : null}

            <View style={styles.texts}>
                <TextMalet style={styles.title} numberOfLines={1}>
                    {title}
                </TextMalet>
                {subtitle ? (
                    <TextMalet style={styles.subtitle} numberOfLines={2}>
                        {subtitle}
                    </TextMalet>
                ) : null}
            </View>
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
    backButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: 4,
    },
    photo: {
        width: 36,
        height: 36,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#f0f0f2',
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
