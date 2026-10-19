import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Link2, UserPlus, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { Customer } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify } from './format';
import { ListRowsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';

/** Sección "Clientes": buscador con paginación keyset, alta y vínculo por ID. */
export default function CustomersSection({ storeId }: { storeId: string }) {
    const customers = useSalesModuleStore((s) => s.customers);
    /** Scroll de la lista: minimiza la cabecera del panel. */
    const headerScroll = useStoreHeaderScroll();
    const customersLoading = useSalesModuleStore((s) => s.customersLoading);
    const loadCustomers = useSalesModuleStore((s) => s.loadCustomers);
    const setCustomersSearch = useSalesModuleStore((s) => s.setCustomersSearch);
    const createCustomer = useSalesModuleStore((s) => s.createCustomer);
    const linkCustomer = useSalesModuleStore((s) => s.linkCustomer);

    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [linkId, setLinkId] = useState('');
    const [saving, setSaving] = useState(false);

    // Búsqueda con retardo para no disparar una petición por tecla.
    useEffect(() => {
        const timer = setTimeout(() => {
            setCustomersSearch(search.trim());
        }, 320);
        return () => clearTimeout(timer);
    }, [search, setCustomersSearch]);

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe el nombre del cliente.');
            return;
        }
        setSaving(true);
        const { linkedExisting, error } = await createCustomer({
            name: trimmed,
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            ...(email.trim() ? { email: email.trim() } : {}),
        });
        setSaving(false);
        if (error) {
            notify('error', error);
            return;
        }
        notify(
            'success',
            linkedExisting
                ? 'Ese teléfono ya existía: se vinculó el cliente.'
                : 'Cliente creado.'
        );
        setName('');
        setPhone('');
        setEmail('');
        setCreateOpen(false);
    };

    const handleLink = async () => {
        const id = linkId.trim();
        if (!id) {
            notify('error', 'Pega el ID del cliente.');
            return;
        }
        setSaving(true);
        const err = await linkCustomer(id);
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        notify('success', 'Cliente vinculado a la tienda.');
        setLinkId('');
        setLinkOpen(false);
    };

    const header = (
        <View style={styles.header}>
            <TextMalet style={styles.description}>
                Cartera de la tienda. Un mismo cliente puede estar en varias tiendas sin
                duplicar datos.
            </TextMalet>

            <InputField
                label="Buscar"
                placeholder="Nombre, teléfono o email"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
            />

            <View style={styles.actions}>
                <Button
                    text="Nuevo cliente"
                    icon={<UserPlus size={15} color="#fff" />}
                    onPress={() => setCreateOpen(true)}
                />
                <Button
                    text="Vincular por ID"
                    icon={<Link2 size={14} color="#fff" />}
                    onPress={() => setLinkOpen(true)}
                />
            </View>

            <SectionTitle icon={Users}>
                Clientes {customers.length > 0 ? `(${customers.length})` : ''}
            </SectionTitle>
        </View>
    );

    const renderCustomer = ({ item }: { item: Customer }) => (
        <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() =>
                router.push({
                    pathname: '/cuaderno/customer',
                    params: { store: storeId, id: item.id },
                } as any)
            }
        >
            <View style={styles.avatar}>
                <TextMalet style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                </TextMalet>
            </View>
            <View style={{ flex: 1 }}>
                <TextMalet style={styles.rowName} numberOfLines={1}>
                    {item.name}
                </TextMalet>
                <TextMalet style={styles.rowSub} numberOfLines={1}>
                    {item.phone || item.email || 'Sin contacto'}
                </TextMalet>
            </View>
            <TextMalet style={styles.chevron}>›</TextMalet>
        </TouchableOpacity>
    );

    return (
        <View style={styles.wrap}>
            <FlashList
                {...headerScroll}
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={renderCustomer}
                ListHeaderComponent={header}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onEndReachedThreshold={0.4}
                onEndReached={() => loadCustomers({ refresh: false })}
                onRefresh={() => loadCustomers({ refresh: true })}
                refreshing={customersLoading && customers.length === 0}
                ListEmptyComponent={
                    customersLoading ? (
                        <ListRowsSkeleton rows={4} />
                    ) : (
                        <View style={styles.empty}>
                            <TextMalet style={styles.emptyTitle}>
                                {search.trim() ? 'Sin resultados' : 'Aún no hay clientes'}
                            </TextMalet>
                            <TextMalet style={styles.emptyText}>
                                {search.trim()
                                    ? 'Prueba con otro término.'
                                    : 'Crea tu primer cliente para asociarlo a las ventas.'}
                            </TextMalet>
                        </View>
                    )
                }
                ListFooterComponent={
                    customersLoading && customers.length > 0 ? (
                        <ActivityIndicator size="small" color="#999" style={styles.footer} />
                    ) : null
                }
            />

            {/* Alta de cliente */}
            <ModalOptions visible={createOpen} onClose={() => setCreateOpen(false)} heightRatio={0.62}>
                <TextMalet style={styles.modalTitle}>Nuevo cliente</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="Nombre"
                        placeholder="Ej: Ana Pérez"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <InputField
                        label="Teléfono (opcional)"
                        placeholder="Ej: 0414-1234567"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <InputField
                        label="Email (opcional)"
                        placeholder="Ej: ana@correo.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextMalet style={styles.modalHint}>
                        Si el teléfono ya existe en alguna de tus tiendas, se vincula ese cliente
                        en vez de crear uno repetido.
                    </TextMalet>
                    <Button text="Crear cliente" onPress={handleCreate} loading={saving} />
                </View>
            </ModalOptions>

            {/* Vínculo por ID (compartir entre tiendas) */}
            <ModalOptions visible={linkOpen} onClose={() => setLinkOpen(false)} heightRatio={0.45}>
                <TextMalet style={styles.modalTitle}>Vincular cliente por ID</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="ID del cliente"
                        placeholder="Pega el ID (UUID)"
                        value={linkId}
                        onChangeText={setLinkId}
                        autoCapitalize="none"
                    />
                    <TextMalet style={styles.modalHint}>
                        Úsalo para compartir un cliente que ya existe en otra tienda.
                    </TextMalet>
                    <Button text="Vincular" onPress={handleLink} loading={saving} />
                </View>
            </ModalOptions>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    header: {
        gap: 12,
        paddingBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    listContent: {
        paddingBottom: 48,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 11,
        paddingHorizontal: 14,
        marginBottom: 8,
        gap: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    rowName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
    },
    chevron: {
        fontSize: 20,
        color: 'rgba(0,0,0,0.25)',
        fontWeight: '600',
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        gap: 6,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
    },
    footer: {
        marginVertical: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    modalBody: {
        gap: 12,
        marginTop: 12,
    },
    modalHint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
});
