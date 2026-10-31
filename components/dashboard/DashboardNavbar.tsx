import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeftRight, FileText, Plus, ShoppingCart } from 'lucide-react-native';
import { memo } from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/useAuthStore';

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

/**
 * Barra inferior flotante con efecto liquid glass. El botón central de crear
 * transacción queda elevado y el resto funciona como accesos rápidos.
 */
const DashboardNavbar = memo(function DashboardNavbar() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    return (
        <View
            pointerEvents="box-none"
            style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) + 8 }]}
        >
            <View style={styles.shadow}>
                <View style={styles.glass}>
                    <BlurView
                        intensity={72}
                        tint="systemChromeMaterialLight"
                        blurMethod={
                            Platform.OS === 'android'
                                ? 'dimezisBlurViewSdk31Plus'
                                : undefined
                        }
                        blurReductionFactor={5}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={[
                            'rgba(255,255,255,0.76)',
                            'rgba(255,255,255,0.34)',
                            'rgba(255,255,255,0.58)',
                        ]}
                        locations={[0, 0.48, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                    <View style={styles.highlight} pointerEvents="none" />

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
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.01)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 22,
        elevation: 16,
    },
    glass: {
        height: 66,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.78)',
        backgroundColor: 'rgba(255,255,255,0.28)',
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 18,
        right: 18,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.88)',
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
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f1f1f1',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
