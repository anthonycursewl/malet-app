import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
    Animated,
    ColorValue,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextMalet from '@/components/TextMalet/TextMalet';
import { LAYOUT_TOP_PADDING } from '@/components/Layout/LayoutAuthenticated';
import { SalesStore, storePhotoUrl } from '@/shared/entities/SalesModule';
import {
    BANNER_FADE_COLORS,
    BANNER_FADE_LOCATIONS,
    BANNER_WIDTH,
    PANEL_HEADER_HEIGHT,
} from './bannerFade';
import { SkeletonBlock, SkeletonShimmer } from './Skeletons';

interface StorePanelHeaderProps {
    /** Tienda abierta (null mientras carga o si ya no existe). */
    store: SalesStore | null;
    /** Miembros activos: respaldo del contador cuando la tienda no lo trae. */
    memberCount: number;
    /**
     * Todavía sin datos: la foto y el nombre se dibujan como skeleton con brillo
     * (en vez del respaldo negro con la inicial).
     */
    loading?: boolean;
    /**
     * Padding horizontal heredado del layout (14 del SafeArea + 4 del contenedor
     * de la pantalla) que se compensa con margen negativo para que la cabecera
     * ocupe todo el ancho, sin espacios laterales. El contenido interno usa el
     * mismo valor para quedar alineado con las pestañas y el resto de la pantalla.
     */
    bleed?: number;
    /**
     * Posición vertical del scroll de la sección activa: al desplazarse la
     * cabecera se minimiza y solo deja la foto y el nombre de la tienda.
     */
    scrollY?: Animated.Value;
}

/** Fotos que no se pudieron cargar (sin conexión o archivo ya borrado). */
interface FailedPhotos {
    avatar: boolean;
    banner: boolean;
}

/** Alto de la cabecera minimizada (solo foto + nombre), sin la barra de estado. */
const COLLAPSED_HEADER_HEIGHT = 52;

/** Píxeles de scroll necesarios para completar la minimización. */
const COLLAPSE_DISTANCE = 72;

/** Tamaño de la foto de la tienda en cada estado. */
const AVATAR_SIZE = 56;
const COLLAPSED_AVATAR_SIZE = 36;

/** Aire bajo la foto y el nombre dentro de la cabecera. */
const BOTTOM_PADDING = 8;

/** Alto reservado al contador de miembros (se colapsa a cero). */
const SUBTITLE_HEIGHT = 17;

/**
 * Base blanca en la parte inferior: garantiza el contraste del nombre y del
 * contador sobre el banner (el degradado horizontal deja el banner visible
 * arriba a la derecha).
 */
const BOTTOM_FADE_COLORS: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.97)',
];

const BOTTOM_FADE_LOCATIONS: readonly [number, number, ...number[]] = [0, 0.42, 1];

/**
 * Velo blanco sobre la barra de estado: la app usa iconos oscuros, así que el
 * banner se aclara justo arriba para que se lean sin cambiar el estilo global.
 */
const STATUS_BAR_SCRIM_COLORS: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
    'rgba(255,255,255,0.55)',
    'rgba(255,255,255,0)',
];

const STATUS_BAR_SCRIM_LOCATIONS: readonly [number, number, ...number[]] = [0, 1];

/**
 * Cabecera del panel de tienda: banner como fondo (visible a la derecha y
 * desvanecido hacia la izquierda, igual que en la lista) con el botón de
 * volver, la foto y el nombre de la tienda encima.
 *
 * Al hacer scroll se minimiza (el banner se desvanece y el contador se oculta)
 * hasta dejar solo la foto y el nombre.
 */
export default function StorePanelHeader({
    store,
    memberCount,
    loading = false,
    bleed = 18,
    scrollY,
}: StorePanelHeaderProps) {
    const insets = useSafeAreaInsets();
    const [failed, setFailed] = useState<FailedPhotos>({
        avatar: false,
        banner: false,
    });
    /** Respaldo cuando la pantalla no controla el scroll (cabecera fija). */
    const [fallbackScroll] = useState(() => new Animated.Value(0));
    const scroll = scrollY ?? fallbackScroll;

    /**
     * Altura a compensar para que la cabecera llegue al borde superior de la
     * pantalla (barra de estado incluida). El contenido baja el mismo valor.
     */
    const topOffset = insets.top + LAYOUT_TOP_PADDING;

    // Interpolaciones: se anima el alto y los tamaños, así que va con driver JS.
    const headerHeight = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [PANEL_HEADER_HEIGHT + topOffset, COLLAPSED_HEADER_HEIGHT + topOffset],
        extrapolate: 'clamp',
    });
    const bannerOpacity = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE * 0.75],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const subtitleOpacity = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE * 0.4],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const subtitleHeight = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE * 0.5],
        outputRange: [SUBTITLE_HEIGHT, 0],
        extrapolate: 'clamp',
    });
    const avatarSize = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [AVATAR_SIZE, COLLAPSED_AVATAR_SIZE],
        extrapolate: 'clamp',
    });
    const avatarRadius = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [18, 12],
        extrapolate: 'clamp',
    });
    const backTop = scroll.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [topOffset + 4, topOffset + 6],
        extrapolate: 'clamp',
    });

    const avatarUrl = failed.avatar
        ? null
        : storePhotoUrl(store, 'avatar', 'medium');
    const bannerUrl = failed.banner
        ? null
        : storePhotoUrl(store, 'banner', 'medium');

    const name = store?.name ?? 'Tienda';
    const subtitle = store
        ? `${memberCount} ${memberCount === 1 ? 'miembro' : 'miembros'}`
        : null;

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/cuaderno' as any);
    };

    return (
        <Animated.View
            style={[
                styles.header,
                bleed > 0 ? { marginHorizontal: -bleed } : null,
                { marginTop: -topOffset, height: headerHeight },
            ]}
        >
            {bannerUrl ? (
                <Animated.View
                    style={[styles.banner, { opacity: bannerOpacity }]}
                    pointerEvents="none"
                >
                    <Animated.Image
                        source={{ uri: bannerUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                        onError={() => setFailed((prev) => ({ ...prev, banner: true }))}
                    />
                    <LinearGradient
                        colors={BANNER_FADE_COLORS}
                        locations={BANNER_FADE_LOCATIONS}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.fill}
                    />
                    <LinearGradient
                        colors={BOTTOM_FADE_COLORS}
                        locations={BOTTOM_FADE_LOCATIONS}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.fill}
                    />
                    {/* Velo de la barra de estado (solo con banner). */}
                    <LinearGradient
                        colors={STATUS_BAR_SCRIM_COLORS}
                        locations={STATUS_BAR_SCRIM_LOCATIONS}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={[styles.statusBarScrim, { height: topOffset }]}
                    />
                </Animated.View>
            ) : null}

            <Animated.View style={[styles.back, { left: bleed - 8, top: backTop }]}>
                <TouchableOpacity
                    onPress={goBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#1f1f1f" />
                </TouchableOpacity>
            </Animated.View>

            {loading ? (
                <SkeletonShimmer
                    style={[
                        styles.bottomRow,
                        { left: bleed, right: bleed, bottom: BOTTOM_PADDING },
                    ]}
                >
                    <SkeletonBlock w={AVATAR_SIZE} h={AVATAR_SIZE} r={18} />
                    <View style={styles.texts}>
                        <SkeletonBlock w={150} h={18} r={7} />
                        <SkeletonBlock
                            w={92}
                            h={11}
                            r={5}
                            style={styles.skeletonLine2}
                        />
                    </View>
                </SkeletonShimmer>
            ) : (
                <View
                    style={[
                        styles.bottomRow,
                        { left: bleed, right: bleed, bottom: BOTTOM_PADDING },
                    ]}
                >
                    {avatarUrl ? (
                        <Animated.Image
                            source={{ uri: avatarUrl }}
                            style={[
                                styles.avatar,
                                {
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarRadius,
                                },
                            ]}
                            resizeMode="cover"
                            onError={() => setFailed((prev) => ({ ...prev, avatar: true }))}
                        />
                    ) : (
                        <Animated.View
                            style={[
                                styles.avatar,
                                styles.avatarFallback,
                                {
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarRadius,
                                },
                            ]}
                        >
                            <TextMalet style={styles.avatarText}>
                                {name.charAt(0).toUpperCase()}
                            </TextMalet>
                        </Animated.View>
                    )}

                    <View style={styles.texts}>
                        <TextMalet style={styles.title} numberOfLines={1}>
                            {name}
                        </TextMalet>
                        {subtitle ? (
                            <Animated.View
                                style={[
                                    styles.subtitleWrap,
                                    { opacity: subtitleOpacity, height: subtitleHeight },
                                ]}
                            >
                                <TextMalet style={styles.subtitle} numberOfLines={1}>
                                    {subtitle}
                                </TextMalet>
                            </Animated.View>
                        ) : null}
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'relative',
        backgroundColor: '#fff',
        // Recorta el banner a sangre (la cabecera ocupa todo el ancho y la barra
        // de estado). El alto real se calcula en el componente según el inset.
        overflow: 'hidden',
        marginBottom: 14,
    },
    banner: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: BANNER_WIDTH,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    fill: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    statusBarScrim: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
    },
    back: {
        position: 'absolute',
        padding: 8,
    },
    bottomRow: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#f0f0f2',
    },
    avatarFallback: {
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 21,
        fontWeight: '700',
        color: '#fff',
    },
    texts: {
        flex: 1,
    },
    title: {
        fontSize: 19,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
        lineHeight: 24,
    },
    subtitleWrap: {
        overflow: 'hidden',
    },
    /** Separación de la segunda línea del skeleton de identidad. */
    skeletonLine2: {
        marginTop: 6,
    },
    subtitle: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.5)',
        lineHeight: SUBTITLE_HEIGHT,
    },
});
