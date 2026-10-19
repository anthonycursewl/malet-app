import { useState } from 'react';
import { CreditCard } from 'lucide-react-native';
import { Alert, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { PaymentMethod } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify, notifyUndo } from './format';
import { PaymentMethodsSkeleton } from './Skeletons';
import SectionTitle from './SectionTitle';

type ModalState = { mode: 'create' } | { mode: 'edit'; method: PaymentMethod } | null;

/**
 * Métodos de cobro: listado, crear/editar (modal), activar/desactivar,
 * soft-delete con "Deshacer" y hard-delete (solo el creador).
 */
export default function PaymentMethodsSection() {
    const user = useAuthStore((s) => s.user);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const paymentMethodsLoading = useSalesModuleStore((s) => s.paymentMethodsLoading);
    const createPaymentMethod = useSalesModuleStore((s) => s.createPaymentMethod);
    const updatePaymentMethod = useSalesModuleStore((s) => s.updatePaymentMethod);
    const deletePaymentMethod = useSalesModuleStore((s) => s.deletePaymentMethod);
    const restorePaymentMethod = useSalesModuleStore((s) => s.restorePaymentMethod);
    const hardDeletePaymentMethod = useSalesModuleStore((s) => s.hardDeletePaymentMethod);

    const [modal, setModal] = useState<ModalState>(null);
    // Alto del bottom-sheet: crear es más compacto que editar (que lleva estado + zona peligrosa).
    const [modalRatio, setModalRatio] = useState(0.5);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const openCreate = () => {
        setName('');
        setModalRatio(0.5);
        setModal({ mode: 'create' });
    };

    const openEdit = (method: PaymentMethod) => {
        setName(method.name);
        setModalRatio(0.65);
        setModal({ mode: 'edit', method });
    };

    const save = async () => {
        if (!modal) return;
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe un nombre para el método de cobro.');
            return;
        }
        setSaving(true);
        const err =
            modal.mode === 'create'
                ? await createPaymentMethod(trimmed)
                : await updatePaymentMethod(modal.method.id, { name: trimmed });
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        setModal(null);
        notify('success', modal.mode === 'create' ? 'Método de cobro creado.' : 'Método de cobro actualizado.');
    };

    const toggleActive = async (method: PaymentMethod) => {
        const err = await updatePaymentMethod(method.id, { active: !method.active });
        if (err) notify('error', err);
    };

    const softDelete = async (method: PaymentMethod) => {
        const err = await deletePaymentMethod(method.id);
        if (err) {
            notify('error', err);
            return;
        }
        setModal(null);
        notifyUndo('Método de cobro eliminado', async () => {
            const restoreErr = await restorePaymentMethod(method.id);
            if (restoreErr) notify('error', restoreErr);
            else notify('success', 'Método de cobro restaurado.');
        });
    };

    const confirmHardDelete = (method: PaymentMethod) => {
        Alert.alert(
            'Eliminar definitivamente',
            `¿Eliminar "${method.name}" para siempre? Las ventas que lo referencien pueden impedirlo (409).`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const err = await hardDeletePaymentMethod(method.id);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        setModal(null);
                        notify('success', 'Método de cobro eliminado definitivamente.');
                    },
                },
            ]
        );
    };

    const editing = modal?.mode === 'edit' ? modal.method : null;
    const canHardDelete = !!editing && (editing.created_by ?? null) === user?.id;

    return (
        <View style={styles.wrap}>
            <TextMalet style={styles.description}>
                Formas de cobro aceptadas en la tienda. Desactivarlos no borra las ventas que ya los
                usan.
            </TextMalet>

            <Button
                text="Nuevo método de cobro"
                icon={<TextMalet style={styles.plus}>＋</TextMalet>}
                style={styles.newBtn}
                onPress={openCreate}
            />

            <SectionTitle icon={CreditCard}>Métodos de cobro</SectionTitle>

            {paymentMethodsLoading && paymentMethods.length === 0 ? (
                <PaymentMethodsSkeleton />
            ) : paymentMethods.length === 0 ? (
                <View style={styles.empty}>
                    <TextMalet style={styles.emptyTitle}>Aún no hay métodos de cobro</TextMalet>
                    <TextMalet style={styles.emptyText}>
                        Crea efectivo, transferencia, tarjeta, etc.
                    </TextMalet>
                </View>
            ) : (
                <View style={styles.list}>
                    {paymentMethods.map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            style={styles.row}
                            activeOpacity={0.7}
                            onPress={() => openEdit(m)}
                        >
                            <View style={{ flex: 1 }}>
                                <TextMalet style={[styles.rowTitle, !m.active && styles.rowTitleMuted]}>
                                    {m.name}
                                </TextMalet>
                                <TextMalet style={styles.rowSub}>
                                    {m.active ? 'Activo' : 'Inactivo'} · toca para editar
                                </TextMalet>
                            </View>
                            <Switch
                                value={!!m.active}
                                onValueChange={() => toggleActive(m)}
                                trackColor={{ false: '#d4d4d8', true: '#a1a1aa' }}
                                thumbColor={m.active ? '#000' : '#f4f4f5'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <ModalOptions visible={modal !== null} onClose={() => setModal(null)} heightRatio={modalRatio}>
                <TextMalet style={styles.modalTitle}>
                    {modal?.mode === 'edit' ? 'Editar método de cobro' : 'Nuevo método de cobro'}
                </TextMalet>

                <View style={styles.modalBody}>
                    <InputField
                        label="Nombre"
                        placeholder="Ej: Efectivo, Pago Móvil"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="sentences"
                    />

                    {editing && (
                        <View style={styles.activeRow}>
                            <View style={{ flex: 1 }}>
                                <TextMalet style={styles.inputLabel}>Estado</TextMalet>
                                <TextMalet style={styles.rowSub}>
                                    {editing.active ? 'Disponible para nuevas ventas' : 'Oculto al registrar ventas'}
                                </TextMalet>
                            </View>
                            <Switch
                                value={!!editing.active}
                                onValueChange={() => toggleActive(editing)}
                                trackColor={{ false: '#d4d4d8', true: '#a1a1aa' }}
                                thumbColor={editing.active ? '#000' : '#f4f4f5'}
                            />
                        </View>
                    )}

                    <Button
                        text={modal?.mode === 'edit' ? 'Guardar cambios' : 'Crear método'}
                        onPress={save}
                        loading={saving}
                        style={styles.saveBtn}
                    />

                    {editing && (
                        <View style={styles.dangerZone}>
                            <Button
                                text="Eliminar método de cobro"
                                onPress={() => softDelete(editing)}
                                labelStyle={styles.dangerLabel}
                                style={styles.dangerBtn}
                            />
                            {canHardDelete && (
                                <Button
                                    text="Eliminar definitivamente"
                                    onPress={() => confirmHardDelete(editing)}
                                    labelStyle={styles.dangerLabel}
                                    style={styles.dangerBtn}
                                />
                            )}
                        </View>
                    )}
                </View>
            </ModalOptions>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: 14,
        paddingBottom: 48,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    newBtn: {
        alignSelf: 'flex-start',
    },
    plus: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 30,
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
    },
    list: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 3,
    },
    rowTitleMuted: {
        color: '#999',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    modalBody: {
        gap: 16,
        paddingTop: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    saveBtn: {
        width: '100%',
    },
    dangerZone: {
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 14,
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
});
