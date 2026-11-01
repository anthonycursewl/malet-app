import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeftRight, FileText, Plus, ShoppingCart } from 'lucide-react-native';
import { memo } from 'react';
import type { RefObject } from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/useAuthStore';

type GlassModule = typeof import('expo-glass-effect');

let glassModule: GlassModule | null = null;
let canUseNativeGlass = false;

// El módulo nativo solo existe en iOS 26+ y en binarios que lo incluyan.
// Si falla, se mantiene el fallback de BlurView + gradientes.
if (Platform.OS === 'ios') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        glassModule = require('expo-glass-effect') as GlassModule;
        canUseNativeGlass =
            glassModule.isLiquidGlassAvailable() &&
            glassModule.isGlassEffectAPIAvailable();
    } catch {
        canUseNativeGlass = false;
    }
}

interface NavItem {
    key: string;
    accessibilityLabel: string;
    route: string;
    icon?: typeof ArrowLeftRight;
}

const ITEMS: NavItem[] = [
    {
        key: 'transactions',
        accessibilityLabel: 'Ver listado de transacciones',
        route: '/wallet/transactions/getAllTransaction',
        icon: ArrowLeftRight,
    },
    {
        key: 'notes',
        accessibilityLabel: 'Abrir notas',
        route: '/notes',
        icon: FileText,
    },
    {
        key: 'create',
        accessibilityLabel: 'Crear nueva transacción',
        route: '/wallet/add',
        icon: Plus,
    },
    {
        key: 'sales',
        accessibilityLabel: 'Abrir Malet Sales',
        route: '/cuaderno',
        icon: ShoppingCart,
    },
    {
        key: 'profile',
        accessibilityLabel: 'Abrir perfil',
        route: '/profile',
    },
];

interface DashboardNavbarProps {
    /** En Android, expo-blur necesita el View que hay detrás para difuminarlo. */
    blurTarget?: RefObject<View | null>;
}

/**
 * Barra inferior flotante con efecto liquid glass. El botón central de crear
 * transacción queda elevado y el resto funciona como accesos rápidos.
 */
const DashboardNavbar = memo(function DashboardNavbar({
    blurTarget,
}: DashboardNavbarProps) {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const NativeGlassView =
        canUseNativeGlass && glassModule ? glassModule.GlassView : null;

    return (
        <View
            pointerEvents="box-none"
            style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) + 8 }]}
        >
            <View style={styles.shadow}>
                <View
                    style={[
                        styles.glass,
                        canUseNativeGlass && styles.nativeGlass,
                    ]}
                >
                    {NativeGlassView ? (
                        <NativeGlassView
                            glassEffectStyle="regular"
                            colorScheme="light"
                            isInteractive
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                        />
                    ) : (
                        <>
                            <BlurView
                                blurTarget={blurTarget}
                                intensity={88}
                                tint="systemUltraThinMaterialLight"
                                blurMethod={
                                    Platform.OS === 'android'
                                        ? 'dimezisBlurViewSdk31Plus'
                                        : undefined
                                }
                                blurReductionFactor={3}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={[
                                    'rgba(255,255,255,0.34)',
                                    'rgba(255,255,255,0.04)',
                                    'rgba(255,255,255,0.19)',
                                ]}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={[
                                    'rgba(198,220,255,0.14)',
                                    'rgba(255,255,255,0.01)',
                                    'rgba(255,214,235,0.08)',
                                ]}
                                locations={[0, 0.5, 1]}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={[
                                    'rgba(0,0,0,0)',
                                    'rgba(0,0,0,0.075)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.bottomShade}
                                pointerEvents="none"
                            />
                            <View style={styles.highlight} pointerEvents="none" />
                            <View style={styles.rim} pointerEvents="none" />
                        </>
                    )}

                    <View style={styles.items}>
                        {ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isCreate = item.key === 'create';

                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={styles.item}
                                    activeOpacity={0.66}
                                    accessibilityLabel={
                                        item.accessibilityLabel
                                    }
                                    accessibilityRole="button"
                                    onPress={() =>
                                        router.push(item.route as any)
                                    }
                                >
                                    {isCreate ? (
                                        <View style={styles.createButton}>
                                            <LinearGradient
                                                colors={[
                                                    '#252b35',
                                                    '#050607',
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={StyleSheet.absoluteFill}
                                                pointerEvents="none"
                                            />
                                            <Plus
                                                size={23}
                                                color="#fff"
                                                strokeWidth={2.4}
                                            />
                                        </View>
                                    ) : item.key === 'profile' ? (
                                        <Image
                                            source={
                                                user?.avatar_url
                                                    ? { uri: user.avatar_url }
                                                    : require('@/assets/images/placeholders/placeholder_avatar.png')
                                            }
                                            style={styles.avatar}
                                        />
                                    ) : Icon ? (
                                        <Icon
                                            size={21}
                                            color="rgba(20,20,20,0.76)"
                                            strokeWidth={1.9}
                                        />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
});

export default DashboardNavbar;

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 200,
    },
    shadow: {
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.01)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 18,
    },
    glass: {
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.64)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    nativeGlass: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 22,
        right: 22,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.92)',
    },
    rim: {
        position: 'absolute',
        top: 1,
        left: 1,
        right: 1,
        bottom: 1,
        borderRadius: 29,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    bottomShade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 12,
    },
    items: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    item: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 37,
        height: 37,
        borderRadius: 18.5,
        backgroundColor: '#f1f1f1',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.24,
        shadowRadius: 8,
        elevation: 8,
    },
});
