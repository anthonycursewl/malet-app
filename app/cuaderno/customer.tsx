import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import ModalOptions from '@/components/shared/ModalOptions';
import { SummaryCardsSkeleton } from '@/components/cuaderno/Skeletons';
import { currencyOf, formatMoney, formatSaleDate, notify } from '@/components/cuaderno/format';
import { CustomerStats } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Detalle del cliente: compras, hábitos y productos favoritos. */
export default function CustomerDetailScreen() {
    const { store: storeId, id: customerId } = useLocalSearchParams<{ store: string; id?: string }>();
    const user = useAuthStore((s) => s.user);
    const customers = useSalesModuleStore((s) => s.customers);
    const fetchCustomerStats = useSalesModuleStore((s) => s.fetchCustomerStats);
    const updateCustomer = useSalesModuleStore((s) => s.updateCustomer);
    const unlinkCustomer = useSalesModuleStore((s) => s.unlinkCustomer);
    const hardDeleteCustomer = useSalesModuleStore((s) => s.hardDeleteCustomer);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const customer = customers.find((c) => c.id === customerId) ?? null;

    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [name, setName] = useState(customer?.name ?? '');
    const [phone, setPhone] = useState(customer?.phone ?? '');
    const [email, setEmail] = useState(customer?.email ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!customerId) return;
        let mounted = true;
        (async () => {
            const { stats: fetched, error } = await fetchCustomerStats(customerId);
            if (!mounted) return;
            if (error || !fetched) {
                notify('error', error ?? 'No se pudieron cargar las estadísticas.');
                setLoading(false);
                return;
            }
            setStats(fetched);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [customerId, fetchCustomerStats]);

    const openEdit = () => {
        setName(customer?.name ?? '');
        setPhone(customer?.phone ?? '');
        setEmail(customer?.email ?? '');
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!customerId) return;
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'El nombre no puede quedar vacío.');
            return;
        }
        setSaving(true);
        const err = await updateCustomer(customerId, {
            name: trimmed,
            phone: phone.trim(),
            email: email.trim(),
        });
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        setEditOpen(false);
        notify('success', 'Cliente actualizado.');
    };

    const confirmUnlink = () => {
        if (!customerId) return;
        Alert.alert(
            'Quitar de la tienda',
            'El cliente dejará de aparecer aquí. Si está en otras tiendas, esas lo conservan.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Quitar',
                    style: 'destructive',
                    onPress: async () => {
                        const err = await unlinkCustomer(customerId);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notify('success', 'Cliente quitado de la tienda.');
                        if (router.canGoBack()) router.back();
                    },
                },
            ]
        );
    };

    const confirmHardDelete = () => {
        if (!customerId) return;
        Alert.alert(
            'Eliminar definitivamente',
            'Se borra la identidad del cliente. Solo funciona si ninguna otra tienda lo usa.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const err = await hardDeleteCustomer(customerId);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notify('success', 'Cliente eliminado definitivamente.');
                        if (router.canGoBack()) router.back();
                    },
                },
            ]
        );
    };

    const isCreator = !!customer && (customer.created_by ?? null) === user?.id;
    const maxWeekday = Math.max(1, ...(stats?.by_weekday ?? []).map((d) => d.sales));

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader
                    title={customer?.name ?? 'Cliente'}
                    subtitle={customer?.phone || customer?.email || 'Sin contacto'}
                />

                {loading ? (
                    <SummaryCardsSkeleton />
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Resumen */}
                        <View style={styles.grid}>
                            <StatCard label="Compras" value={String(stats?.purchase_count ?? 0)} />
                            <StatCard label="Unidades" value={String(stats?.units_bought ?? 0)} />
                            <StatCard
                                label="Total gastado"
                                value={formatMoney(stats?.total_spent ?? 0, currency)}
                            />
                            <StatCard
                                label="Ticket promedio"
                                value={formatMoney(stats?.average_ticket ?? 0, currency)}
                                highlight
                            />
                        </View>

                        {/* Frecuencia */}
                        <View style={styles.card}>
                            <TextMalet style={styles.cardTitle}>Frecuencia de compra</TextMalet>
                            <TextMalet style={styles.frequency}>
                                {stats?.average_days_between != null
                                    ? `Compra cada ~${stats.average_days_between} días`
                                    : 'Aún no hay suficientes compras para estimarla'}
                            </TextMalet>
                            <View style={styles.datesRow}>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.metaLabel}>Primera compra</TextMalet>
                                    <TextMalet style={styles.metaValue}>
                                        {stats?.first_purchase_at
                                            ? formatSaleDate(stats.first_purchase_at)
                                            : '—'}
                                    </TextMalet>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.metaLabel}>Última compra</TextMalet>
                                    <TextMalet style={styles.metaValue}>
                                        {stats?.last_purchase_at
                                            ? formatSaleDate(stats.last_purchase_at)
                                            : '—'}
                                    </TextMalet>
                                </View>
                            </View>
                        </View>

                        {/* Días en que compra */}
                        <View style={styles.card}>
                            <TextMalet style={styles.cardTitle}>Días en que más compra</TextMalet>
                            <View style={styles.weekRow}>
                                {WEEKDAYS.map((label, index) => {
                                    const point = stats?.by_weekday.find((d) => d.weekday === index);
                                    const sales = point?.sales ?? 0;
                                    const height = Math.max(4, (sales / maxWeekday) * 54);
                                    return (
                                        <View key={label} style={styles.weekCol}>
                                            <TextMalet style={styles.weekValue}>
                                                {sales > 0 ? sales : ''}
                                            </TextMalet>
                                            <View
                                                style={[
                                                    styles.weekBar,
                                                    {
                                                        height,
                                                        backgroundColor:
                                                            sales > 0 ? '#111' : '#e9e9ec',
                                                    },
                                                ]}
                                            />
                                            <TextMalet style={styles.weekLabel}>{label}</TextMalet>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Productos favoritos */}
                        {(stats?.top_products ?? []).length > 0 && (
                            <View style={styles.card}>
                                <TextMalet style={styles.cardTitle}>Lo que más compra</TextMalet>
                                {stats!.top_products.map((product) => (
                                    <View key={product.product_id} style={styles.listRow}>
                                        <TextMalet style={styles.listName} numberOfLines={1}>
                                            {product.product_name}
                                        </TextMalet>
                                        <TextMalet style={styles.listValue}>
                                            {product.units} uds ·{' '}
                                            {formatMoney(product.revenue, currency)}
                                        </TextMalet>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Métodos de cobro */}
                        {(stats?.top_payment_methods ?? []).length > 0 && (
                            <View style={styles.card}>
                                <TextMalet style={styles.cardTitle}>
                                    Métodos de cobro que más usa
                                </TextMalet>
                                {stats!.top_payment_methods.map((method, index) => (
                                    <View key={`${method.payment_method_id}-${index}`} style={styles.listRow}>
                                        <TextMalet style={styles.listName}>
                                            {method.name ?? 'Sin método'}
                                        </TextMalet>
                                        <TextMalet style={styles.listValue}>
                                            {method.sales}{' '}
                                            {method.sales === 1 ? 'venta' : 'ventas'}
                                        </TextMalet>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Compras recientes */}
                        {(stats?.recent_sales ?? []).length > 0 && (
                            <View style={styles.card}>
                                <TextMalet style={styles.cardTitle}>Compras recientes</TextMalet>
                                {stats!.recent_sales.map((sale) => (
                                    <TouchableOpacity
                                        key={sale.id}
                                        style={styles.saleRow}
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/cuaderno/sale-detail',
                                                params: { store: storeId, id: sale.id },
                                            } as any)
                                        }
                                    >
                                        <View style={{ flex: 1 }}>
                                            <TextMalet style={styles.listName}>
                                                {formatSaleDate(sale.sold_at)}
                                            </TextMalet>
                                            <TextMalet style={styles.metaLabel}>
                                                {sale.items} {sale.items === 1 ? 'unidad' : 'unidades'}
                                            </TextMalet>
                                        </View>
                                        <TextMalet style={styles.listValue}>
                                            {formatMoney(sale.total, currency)}
                                        </TextMalet>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Button text="Editar cliente" onPress={openEdit} style={styles.actionBtn} />

                        <View style={styles.dangerZone}>
                            <Button
                                text="Quitar de la tienda"
                                onPress={confirmUnlink}
                                style={styles.dangerBtn}
                                labelStyle={styles.dangerLabel}
                            />
                            {isCreator && (
                                <Button
                                    text="Eliminar definitivamente"
                                    onPress={confirmHardDelete}
                                    style={styles.dangerBtn}
                                    labelStyle={styles.dangerLabel}
                                />
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>

            <ModalOptions visible={editOpen} onClose={() => setEditOpen(false)} heightRatio={0.62}>
                <TextMalet style={styles.modalTitle}>Editar cliente</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="Nombre"
                        placeholder="Ej: Ana Pérez"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <InputField
                        label="Teléfono"
                        placeholder="Ej: 0414-1234567"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <InputField
                        label="Email"
                        placeholder="Ej: ana@correo.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextMalet style={styles.modalHint}>
                        Al ser una identidad compartida, los cambios se ven en todas las tiendas
                        donde esté el cliente.
                    </TextMalet>
                    <Button text="Guardar" onPress={saveEdit} loading={saving} />
                </View>
            </ModalOptions>
        </LayoutAuthenticated>
    );
}

function StatCard({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
            <TextMalet style={[styles.statLabel, highlight && styles.statLabelHighlight]}>
                {label}
            </TextMalet>
            <TextMalet style={[styles.statValue, highlight && styles.statValueHighlight]}>
                {value}
            </TextMalet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    scrollContent: {
        paddingBottom: 48,
        gap: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 3,
    },
    statCardHighlight: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
    },
    statLabelHighlight: {
        color: 'rgba(255,255,255,0.6)',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    statValueHighlight: {
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    frequency: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },
    datesRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    metaLabel: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
        marginTop: 2,
    },
    weekRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 6,
        paddingTop: 8,
    },
    weekCol: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    weekValue: {
        fontSize: 10,
        fontWeight: '700',
        color: '#111',
        height: 12,
    },
    weekBar: {
        width: '100%',
        borderRadius: 6,
    },
    weekLabel: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.45)',
        fontWeight: '600',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingVertical: 7,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    listName: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
        flexShrink: 1,
    },
    listValue: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#111',
    },
    saleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    actionBtn: {
        width: '100%',
    },
    dangerZone: {
        gap: 8,
    },
    dangerBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
        width: '100%',
    },
    dangerLabel: {
        color: '#dc2626',
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
