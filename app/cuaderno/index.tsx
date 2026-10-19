import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ScanLine } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import { StoresSkeleton } from '@/components/cuaderno/Skeletons';
import { SalesStore, STORE_CURRENCIES, StoreCurrency, storePhotoUrl } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify } from '@/components/cuaderno/format';
import {
    BANNER_FADE_COLORS,
    BANNER_FADE_LOCATIONS,
    BANNER_WIDTH,
} from '@/components/cuaderno/bannerFade';

/**
 * Fila de una tienda: banner de fondo en la mitad derecha (atenuándose hacia la
 * izquierda con un degradado) + foto (resolución `small`) o su inicial como
 * respaldo cuando no hay foto o la imagen no carga.
 */
function StoreRow({ store, onPress }: { store: SalesStore; onPress: () => void }) {
    const [failed, setFailed] = useState({ avatar: false, banner: false });
    const avatarUrl = failed.avatar ? null : storePhotoUrl(store, 'avatar', 'small');
    // El banner ocupa casi todo el ancho de la tarjeta: necesita la resolución
    // `medium` para verse nítido en pantallas 3x.
    const bannerUrl = failed.banner ? null : storePhotoUrl(store, 'banner', 'medium');

    return (
        <TouchableOpacity style={styles.storeRow} activeOpacity={0.7} onPress={onPress}>
            {/* Banner como fondo: visible a la derecha, desvanecido hacia la izquierda. */}
            {bannerUrl ? (
                <View style={styles.rowBanner} pointerEvents="none">
                    <Image
                        source={{ uri: bannerUrl }}
                        style={styles.rowBannerImage}
                        resizeMode="cover"
                        onError={() => setFailed((prev) => ({ ...prev, banner: true }))}
                    />
                    <LinearGradient
                        colors={BANNER_FADE_COLORS}
                        locations={BANNER_FADE_LOCATIONS}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.rowBannerFade}
                    />
                </View>
            ) : null}

            {avatarUrl ? (
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.storeAvatarImage}
                    resizeMode="cover"
                    onError={() => setFailed((prev) => ({ ...prev, avatar: true }))}
                />
            ) : (
                <View style={styles.storeAvatar}>
                    <TextMalet style={styles.storeAvatarText}>
                        {store.name.charAt(0).toUpperCase()}
                    </TextMalet>
                </View>
            )}
            <View style={[styles.storeTexts, bannerUrl ? styles.storeTextsOnBanner : null]}>
                <TextMalet style={styles.storeName} numberOfLines={1}>
                    {store.name}
                </TextMalet>
                <TextMalet
                    style={[styles.storeSub, bannerUrl ? styles.storeSubOnBanner : null]}
                >
                    {store.member_count != null
                        ? `${store.member_count} ${store.member_count === 1 ? 'miembro' : 'miembros'}`
                        : 'Miembro activo'}
                    {' · '}
                    {store.currency ?? 'Bs'}
                </TextMalet>
            </View>
            <TextMalet
                style={[styles.chevron, bannerUrl ? styles.chevronOnBanner : null]}
            >
                ›
            </TextMalet>
        </TouchableOpacity>
    );
}

/**
 * Lista de tiendas del Cuaderno de Ventas: crear, entrar y escanear invitaciones QR.
 */
export default function CuadernoVentasScreen() {
    const stores = useSalesModuleStore((s) => s.stores);
    const storesLoading = useSalesModuleStore((s) => s.storesLoading);
    const error = useSalesModuleStore((s) => s.error);
    const loadStores = useSalesModuleStore((s) => s.loadStores);
    const createStore = useSalesModuleStore((s) => s.createStore);

    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState<StoreCurrency>('Bs');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadStores({ refresh: true });
    }, [loadStores]);

    useEffect(() => {
        if (error) Alert.alert('Malet | Error', error);
    }, [error]);

    const submitCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe el nombre de la tienda.');
            return;
        }
        setCreating(true);
        const err = await createStore(trimmed, currency);
        setCreating(false);
        if (err) {
            notify('error', err);
            return;
        }
        setName('');
        setCurrency('Bs');
        setModalOpen(false);
        notify('success', 'Tienda creada.');
    };

    const renderStore = ({ item }: { item: SalesStore }) => (
        <StoreRow
            store={item}
            onPress={() =>
                router.push({ pathname: '/cuaderno/store', params: { store: item.id } } as any)
            }
        />
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader
                    title="Malet Sales"
                    subtitle="Tiendas, productos, cobros y ventas"
                    style={styles.header}
                />

                <View style={styles.actionsRow}>
                    <Button
                        text="Escanear QR"
                        icon={<ScanLine size={14} color="#fff" />}
                        style={styles.actionBtn}
                        onPress={() => router.push('/cuaderno/scan' as any)}
                    />
                    <Button
                        text="Nueva tienda"
                        icon={<Plus size={14} color="#fff" />}
                        style={styles.actionBtn}
                        onPress={() => setModalOpen(true)}
                    />
                </View>

                <TextMalet style={styles.sectionTitle}>Mis tiendas</TextMalet>

                {storesLoading && stores.length === 0 ? (
                    <StoresSkeleton />
                ) : (
                    <FlatList
                        data={stores}
                        keyExtractor={(item) => item.id}
                        renderItem={renderStore}
                        contentContainerStyle={
                            stores.length === 0 ? styles.emptyContent : styles.listContent
                        }
                        showsVerticalScrollIndicator={false}
                        onEndReached={() => loadStores({ refresh: false })}
                        onEndReachedThreshold={0.4}
                        onRefresh={() => loadStores({ refresh: true })}
                        refreshing={storesLoading && stores.length > 0}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>Aún no tienes tiendas</TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    Crea una tienda o escanea el QR de invitación de un dueño para
                                    empezar.
                                </TextMalet>
                            </View>
                        }
                    />
                )}
            </View>

            <ModalOptions visible={modalOpen} onClose={() => setModalOpen(false)} heightRatio={0.55}>
                <TextMalet style={styles.modalTitle}>Nueva tienda</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="Nombre de la tienda"
                        placeholder="Ej: Panadería La Espiga"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <View style={styles.currencyGroup}>
                        <TextMalet style={styles.currencyLabel}>Moneda</TextMalet>
                        <View style={styles.currencyRow}>
                            {STORE_CURRENCIES.map((c) => {
                                const active = c === currency;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.currencyChip, active && styles.currencyChipActive]}
                                        onPress={() => setCurrency(c)}
                                    >
                                        <TextMalet
                                            style={[
                                                styles.currencyChipText,
                                                active && styles.currencyChipTextActive,
                                            ]}
                                        >
                                            {c}
                                        </TextMalet>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TextMalet style={styles.modalHint}>
                            Todos los montos de la tienda se mostrarán en esta moneda y no hay
                            conversión entre ellas.
                        </TextMalet>
                    </View>
                    <TextMalet style={styles.modalHint}>
                        Quedarás como dueño y miembro activo de la tienda.
                    </TextMalet>
                    <Button text="Crear tienda" onPress={submitCreate} loading={creating} />
                </View>
            </ModalOptions>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    header: {
        marginBottom: 14,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 22,
    },
    actionBtn: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    listContent: {
        paddingBottom: 40,
        gap: 8,
    },
    emptyContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    storeRow: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
        // Recorta el banner de fondo con las esquinas de la tarjeta.
        overflow: 'hidden',
    },
    rowBanner: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: BANNER_WIDTH,
    },
    rowBannerImage: {
        width: '100%',
        height: '100%',
    },
    rowBannerFade: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    storeAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    storeAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0f0f2',
    },
    storeAvatarText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    storeTexts: {
        flex: 1,
    },
    /** Con banner: el texto no invade la zona del degradado (contraste garantizado). */
    storeTextsOnBanner: {
        maxWidth: '52%',
    },
    storeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    storeSub: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.4)',
    },
    /** Sobre el degradado el subtítulo sube un punto de contraste. */
    storeSubOnBanner: {
        color: 'rgba(0,0,0,0.55)',
    },
    chevron: {
        fontSize: 22,
        color: 'rgba(0,0,0,0.25)',
        fontWeight: '600',
    },
    /** Sobre el banner el chevron va en blanco, con sombra para asegurar contraste. */
    chevronOnBanner: {
        color: 'rgba(255,255,255,0.95)',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    empty: {
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12,
    },
    modalBody: {
        gap: 12,
    },
    modalHint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    currencyGroup: {
        gap: 8,
    },
    currencyLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },
    currencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    currencyChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    currencyChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    currencyChipText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    currencyChipTextActive: {
        color: '#fff',
    },
});
