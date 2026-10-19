import { FlashList } from '@shopify/flash-list';
import { Check, Link2, UserPlus } from 'lucide-react-native';
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

interface CustomerPickerModalProps {
    visible: boolean;
    selectedId?: string | null;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

/**
 * Selector de cliente con búsqueda y paginación keyset (`seq`) para que la
 * lista sea infinita sin degradar el rendimiento.
 */
export default function CustomerPickerModal({
    visible,
    selectedId,
    onClose,
    onSelect,
}: CustomerPickerModalProps) {
    const customers = useSalesModuleStore((s) => s.customers);
    const customersLoading = useSalesModuleStore((s) => s.customersLoading);
    const loadCustomers = useSalesModuleStore((s) => s.loadCustomers);
    const setCustomersSearch = useSalesModuleStore((s) => s.setCustomersSearch);
    const createCustomer = useSalesModuleStore((s) => s.createCustomer);
    const linkCustomer = useSalesModuleStore((s) => s.linkCustomer);

    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkId, setLinkId] = useState('');

    // Búsqueda con retardo corto para no disparar una petición por tecla.
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => {
            setCustomersSearch(search.trim());
        }, 320);
        return () => clearTimeout(timer);
    }, [search, visible, setCustomersSearch]);

    const handleCreate = async () => {
        const name = search.trim();
        if (!name) return;
        setCreating(true);
        const { customer, linkedExisting, error } = await createCustomer({ name });
        setCreating(false);
        if (error || !customer) {
            notify('error', error ?? 'No se pudo crear el cliente.');
            return;
        }
        notify(
            'success',
            linkedExisting ? 'Cliente existente vinculado.' : 'Cliente creado.'
        );
        setSearch('');
        onSelect(customer);
    };

    const handleLink = async () => {
        const id = linkId.trim();
        if (!id) {
            notify('error', 'Pega el ID del cliente.');
            return;
        }
        const err = await linkCustomer(id);
        if (err) {
            notify('error', err);
            return;
        }
        const linked = useSalesModuleStore.getState().customers.find((c) => c.id === id);
        notify('success', 'Cliente vinculado a la tienda.');
        setLinkId('');
        setLinkOpen(false);
        if (linked) onSelect(linked);
    };

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.75}>
            <TextMalet style={styles.title}>Cliente</TextMalet>
            <TextMalet style={styles.subtitle}>
                Opcional. Busca uno existente, créalo al vuelo o vincula uno de otra tienda
                por su ID.
            </TextMalet>

            <View style={styles.searchWrap}>
                <InputField
                    label="Buscar"
                    placeholder="Nombre, teléfono o email"
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {search.trim().length > 0 && (
                <Button
                    text={`Crear “${search.trim()}”`}
                    icon={<UserPlus size={15} color="#fff" />}
                    onPress={handleCreate}
                    loading={creating}
                    style={styles.createBtn}
                />
            )}

            <TouchableOpacity
                style={styles.linkToggle}
                onPress={() => setLinkOpen((v) => !v)}
                activeOpacity={0.7}
            >
                <Link2 size={14} color="#555" />
                <TextMalet style={styles.linkToggleText}>
                    {linkOpen ? 'Ocultar vincular por ID' : 'Vincular un cliente por ID'}
                </TextMalet>
            </TouchableOpacity>

            {linkOpen && (
                <View style={styles.linkBox}>
                    <InputField
                        label="ID del cliente"
                        placeholder="Pega el ID (UUID)"
                        value={linkId}
                        onChangeText={setLinkId}
                        autoCapitalize="none"
                    />
                    <Button text="Vincular" onPress={handleLink} />
                </View>
            )}

            <View style={styles.listWrap}>
                <FlashList
                    data={customers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const active = item.id === selectedId;
                        return (
                            <TouchableOpacity
                                style={[styles.row, active && styles.rowActive]}
                                onPress={() => onSelect(item)}
                                activeOpacity={0.7}
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
                                {active && <Check size={16} color="#111" />}
                            </TouchableOpacity>
                        );
                    }}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadCustomers({ refresh: false })}
                    ListEmptyComponent={
                        customersLoading ? (
                            <ListRowsSkeleton rows={3} />
                        ) : (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>
                                    {search.trim()
                                        ? 'Sin resultados'
                                        : 'Aún no hay clientes'}
                                </TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    {search.trim()
                                        ? 'Prueba con otro término o créalo con el botón de arriba.'
                                        : 'Crea uno escribiendo su nombre en el buscador.'}
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
            </View>

            <Button
                text="Sin cliente"
                onPress={onClose}
                style={styles.clearBtn}
                labelStyle={styles.clearLabel}
            />
        </ModalOptions>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
        marginTop: 3,
    },
    searchWrap: {
        marginTop: 12,
    },
    createBtn: {
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    linkToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 4,
    },
    linkToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    linkBox: {
        gap: 10,
        marginTop: 8,
    },
    listWrap: {
        flex: 1,
        marginTop: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 4,
    },
    rowActive: {
        backgroundColor: '#f4f4f5',
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#f0f0f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    rowName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 2,
    },
    empty: {
        alignItems: 'center',
        marginTop: 24,
        gap: 6,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 12.5,
        color: '#888',
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        marginVertical: 12,
    },
    clearBtn: {
        width: '100%',
        marginTop: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    clearLabel: {
        color: '#555',
    },
});
