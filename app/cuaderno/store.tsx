import { useLocalSearchParams } from 'expo-router';
import {
    CreditCard,
    FileText,
    LucideIcon,
    Package,
    ReceiptText,
    Settings,
    ShoppingCart,
    UserCheck,
    Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import LayoutAuthenticated, {
    LAYOUT_HORIZONTAL_PADDING,
} from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CustomersSection from '@/components/cuaderno/CustomersSection';
import InvoicesSection from '@/components/cuaderno/InvoicesSection';
import { StorePanelSkeleton } from '@/components/cuaderno/Skeletons';
import { useChipScroll } from '@/components/cuaderno/useChipScroll';
import MembersSection from '@/components/cuaderno/MembersSection';
import PaymentMethodsSection from '@/components/cuaderno/PaymentMethodsSection';
import ProductsSection from '@/components/cuaderno/ProductsSection';
import ReceiptsSection from '@/components/cuaderno/ReceiptsSection';
import SalesSection from '@/components/cuaderno/SalesSection';
import StorePanelHeader from '@/components/cuaderno/StorePanelHeader';
import StoreSettingsSection from '@/components/cuaderno/StoreSettingsSection';
import { StoreHeaderScrollProvider } from '@/components/cuaderno/storeHeaderScroll';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

type Tab =
    | 'ventas'
    | 'facturas'
    | 'recibos'
    | 'productos'
    | 'pagos'
    | 'clientes'
    | 'miembros'
    | 'ajustes';

/** Padding horizontal propio de esta pantalla (además del que trae el layout). */
const SCREEN_PADDING = 4;

/** Sangrado de la cabecera: compensa el layout + el padding de esta pantalla. */
const HEADER_BLEED = LAYOUT_HORIZONTAL_PADDING + SCREEN_PADDING;

const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { value: 'facturas', label: 'Facturas', icon: FileText },
    { value: 'recibos', label: 'Recibos', icon: ReceiptText },
    { value: 'productos', label: 'Productos', icon: Package },
    { value: 'pagos', label: 'Métodos de cobro', icon: CreditCard },
    { value: 'clientes', label: 'Clientes', icon: Users },
    { value: 'miembros', label: 'Miembros', icon: UserCheck },
    { value: 'ajustes', label: 'Ajustes', icon: Settings },
];

/**
 * Panel de una tienda: cabecera fija + pestañas
 * (ventas, productos, cobros, miembros y ajustes).
 */
export default function StorePanelScreen() {
    const { store: storeId } = useLocalSearchParams<{ store: string }>();
    const loading = useSalesModuleStore((s) => s.loading);
    const error = useSalesModuleStore((s) => s.error);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const members = useSalesModuleStore((s) => s.members);
    const enterStore = useSalesModuleStore((s) => s.enterStore);

    const [tab, setTab] = useState<Tab>('ventas');
    const { scrollRef, onViewportLayout, onChipLayout, scrollToChip } = useChipScroll();

    /** Scroll de la sección activa: minimiza la cabecera al desplazarse. */
    const [headerScrollY] = useState(() => new Animated.Value(0));
    const handleHeaderScroll = useMemo(
        () =>
            Animated.event(
                [{ nativeEvent: { contentOffset: { y: headerScrollY } } }],
                { useNativeDriver: false }
            ),
        [headerScrollY]
    );

    /** La lista nueva empieza arriba, así que la cabecera vuelve a su tamaño. */
    const selectTab = (next: Tab) => {
        setTab(next);
        headerScrollY.setValue(0);
        scrollToChip(next);
    };

    useEffect(() => {
        if (storeId) enterStore(storeId);
    }, [storeId, enterStore]);

    useEffect(() => {
        if (error) Alert.alert('Malet | Error', error);
    }, [error]);

    const memberCount = currentStore?.member_count ?? members.length;

    if (loading && !currentStore) {
        return (
            <LayoutAuthenticated>
                <View style={styles.loadingContainer}>
                    <StorePanelHeader
                        store={null}
                        memberCount={0}
                        bleed={HEADER_BLEED}
                        loading
                    />
                    <StorePanelSkeleton />
                </View>
            </LayoutAuthenticated>
        );
    }

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <StorePanelHeader
                    store={currentStore}
                    memberCount={memberCount}
                    bleed={HEADER_BLEED}
                    scrollY={headerScrollY}
                />

                <ScrollView
                    ref={scrollRef}
                    onLayout={onViewportLayout}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsRow}
                >
                    {TABS.map((t) => {
                        const active = t.value === tab;
                        const Icon = t.icon;
                        return (
                            <TouchableOpacity
                                key={t.value}
                                onLayout={onChipLayout(t.value)}
                                style={[styles.tab, active && styles.tabActive]}
                                onPress={() => selectTab(t.value)}
                            >
                                <View style={styles.tabContent}>
                                    <Icon
                                        size={14}
                                        color={active ? '#fff' : '#555'}
                                    />
                                    <TextMalet
                                        style={[styles.tabText, active && styles.tabTextActive]}
                                    >
                                        {t.label}
                                    </TextMalet>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.tabsDivider} />

                <StoreHeaderScrollProvider onScroll={handleHeaderScroll}>
                    <View style={styles.section}>
                        {tab === 'ventas' && <SalesSection storeId={storeId ?? ''} />}
                        {tab === 'facturas' && <InvoicesSection storeId={storeId ?? ''} />}
                        {tab === 'recibos' && <ReceiptsSection storeId={storeId ?? ''} />}
                        {tab === 'productos' && <ProductsSection storeId={storeId ?? ''} />}
                        {tab === 'pagos' && <PaymentMethodsSection />}
                        {tab === 'clientes' && <CustomersSection storeId={storeId ?? ''} />}
                        {tab === 'miembros' && <MembersSection storeId={storeId ?? ''} />}
                        {tab === 'ajustes' && <StoreSettingsSection />}
                    </View>
                </StoreHeaderScrollProvider>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: SCREEN_PADDING,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: SCREEN_PADDING,
    },
    tabsScroll: {
        flexGrow: 0,
    },
    tabsRow: {
        alignItems: 'center',
        gap: 8,
        paddingBottom: 10,
        paddingRight: 12,
    },
    tabsDivider: {
        height: 1,
        marginHorizontal: -18,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    tabText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    tabTextActive: {
        color: '#fff',
    },
    section: {
        flex: 1,
        paddingTop: 14,
    },
});
