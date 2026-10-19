import { Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { STORE_CURRENCIES, StoreCurrency, RECEIPT_MODE_OPTIONS, StoreReceiptMode } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import StorePhotosCard from './StorePhotosCard';
import { notify, notifyUndo } from './format';
import SalesDefaultRangeCard from './SalesDefaultRangeCard';
import StoreNotificationsCard from './StoreNotificationsCard';
import { SettingsSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';

/**
 * Ajustes de la tienda: renombrar (cualquier miembro),
 * soft-delete (cualquier miembro) y hard-delete (solo el dueño, con cascada).
 */
export default function StoreSettingsSection() {
    const user = useAuthStore((s) => s.user);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    /** Scroll del panel: minimiza la cabecera. */
    const headerScroll = useStoreHeaderScroll();
    const updateStore = useSalesModuleStore((s) => s.updateStore);
    const deleteStore = useSalesModuleStore((s) => s.deleteStore);
    const hardDeleteStore = useSalesModuleStore((s) => s.hardDeleteStore);
    const restoreStore = useSalesModuleStore((s) => s.restoreStore);

    const [renameOpen, setRenameOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    /** Opción de recibos que se está guardando (feedback de carga). */
    const [savingMode, setSavingMode] = useState<StoreReceiptMode | null>(null);
    /** Cambio de moneda en curso. */
    const [savingCurrency, setSavingCurrency] = useState<StoreCurrency | null>(null);

    const isOwner = currentStore?.user_id === user?.id;
    const currentCurrency: StoreCurrency = currentStore?.currency ?? 'Bs';

    const openRename = () => {
        setName(currentStore?.name ?? '');
        setRenameOpen(true);
    };

    const saveRename = async () => {
        if (!currentStore) return;
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'El nombre no puede quedar vacío.');
            return;
        }
        setSaving(true);
        const err = await updateStore(currentStore.id, { name: trimmed });
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        setRenameOpen(false);
        notify('success', 'Tienda renombrada.');
    };

    const changeCurrency = (next: StoreCurrency) => {        if (!currentStore || next === currentCurrency) return;
        Alert.alert(
            'Cambiar moneda',
            `Los montos se seguirán mostrando tal cual, ahora con el símbolo "${next}" (sin conversión). Solo puedes cambiarla si la tienda no tiene ventas.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cambiar',
                    style: 'destructive',
                    onPress: async () => {
                        setSavingCurrency(next);
                        const err = await updateStore(currentStore.id, { currency: next });
                        setSavingCurrency(null);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notify('success', `Moneda cambiada a ${next}.`);
                    },
                },
            ]
        );
    };

    const openContact = () => {
        setPhone(currentStore?.phone ?? '');
        setEmail(currentStore?.email ?? '');
        setAddress(currentStore?.address ?? '');
        setContactOpen(true);
    };

    const saveContact = async () => {
        if (!currentStore) return;
        const trimmedEmail = email.trim();
        if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            notify('error', 'Escribe un correo válido.');
            return;
        }
        setSaving(true);
        const err = await updateStore(currentStore.id, {
            phone: phone.trim(),
            email: trimmedEmail,
            address: address.trim(),
        });
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        setContactOpen(false);
        notify('success', 'Información de la tienda actualizada.');
    };

    /** Política de recibos: solo el dueño puede cambiarla. */
    const changeReceiptMode = async (mode: StoreReceiptMode) => {
        if (!currentStore) return;
        if (!isOwner) {
            notify('error', 'Solo el dueño de la tienda puede cambiar esta opción.');
            return;
        }
        if ((currentStore.receipt_mode ?? 'ask') === mode) return;

        setSavingMode(mode);
        const err = await updateStore(currentStore.id, { receipt_mode: mode });
        setSavingMode(null);
        if (err) {
            notify('error', err);
            return;
        }
        notify('success', 'Política de recibos actualizada.');
    };

    const confirmSoftDelete = () => {
        if (!currentStore) return;
        Alert.alert(
            'Eliminar tienda',
            `¿Deseas eliminar "${currentStore.name}"? Se restaura mientras la acción esté visible.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const storeId = currentStore.id;
                        const storeName = currentStore.name;
                        const err = await deleteStore(storeId);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notifyUndo(`"${storeName}" fue eliminada.`, async () => {
                            const restoreErr = await restoreStore(storeId);
                            if (restoreErr) notify('error', restoreErr);
                        });
                        if (router.canGoBack()) router.back();
                    },
                },
            ]
        );
    };

    const confirmHardDelete = () => {
        if (!currentStore) return;
        Alert.alert(
            'Eliminar definitivamente',
            `Esta acción borra "${currentStore.name}" para siempre, incluyendo miembros, productos, métodos de cobro y ventas. No se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar todo',
                    style: 'destructive',
                    onPress: async () => {
                        const err = await hardDeleteStore(currentStore.id);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notify('success', 'Tienda eliminada definitivamente.');
                        if (router.canGoBack()) router.back();
                    },
                },
            ]
        );
    };

    if (!currentStore) {
        return (
            <View style={styles.wrap}>
                <SettingsSkeleton />
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <ScrollView
                {...headerScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
            <SectionTitle icon={Settings}>Ajustes de la tienda</SectionTitle>

            <TextMalet style={styles.description}>
                Configuración general de la tienda. Cualquier miembro activo puede renombrarla,
                cambiar su moneda (solo si no tiene ventas) o eliminarla.
            </TextMalet>

            <StorePhotosCard />

            <View style={styles.card}>
                <View style={styles.cardTexts}>
                    <TextMalet style={styles.cardTitle}>Nombre de la tienda</TextMalet>
                    <TextMalet style={styles.cardSub} numberOfLines={1}>
                        {currentStore?.name ?? '—'}
                    </TextMalet>
                </View>
                <Button text="Renombrar" onPress={openRename} />
            </View>

            <View style={styles.currencyCard}>
                <TextMalet style={styles.cardTitle}>Información de contacto</TextMalet>
                <TextMalet style={styles.cardSub}>
                    Se imprime en el recibo como datos del emisor (teléfono, correo y dirección).
                </TextMalet>
                <View style={styles.contactRows}>
                    <TextMalet style={styles.contactRow} numberOfLines={1}>
                        <TextMalet style={styles.contactRowLabel}>Teléfono: </TextMalet>
                        {currentStore.phone || '—'}
                    </TextMalet>
                    <TextMalet style={styles.contactRow} numberOfLines={1}>
                        <TextMalet style={styles.contactRowLabel}>Correo: </TextMalet>
                        {currentStore.email || '—'}
                    </TextMalet>
                    <TextMalet style={styles.contactRow} numberOfLines={2}>
                        <TextMalet style={styles.contactRowLabel}>Dirección: </TextMalet>
                        {currentStore.address || '—'}
                    </TextMalet>
                </View>
                {isOwner ? (
                    <Button
                        text="Editar información"
                        onPress={openContact}
                        style={styles.contactBtn}
                    />
                ) : (
                    <TextMalet style={styles.modeHint}>
                        Solo el dueño de la tienda puede editar esta información.
                    </TextMalet>
                )}
            </View>

            <View style={styles.currencyCard}>
                <TextMalet style={styles.cardTitle}>Recibos</TextMalet>
                <TextMalet style={styles.cardSub}>
                    Define si las ventas emiten recibo. Solo el dueño de la tienda puede cambiarlo.
                </TextMalet>
                <View style={styles.modeOptions}>
                    {RECEIPT_MODE_OPTIONS.map((option) => {
                        const active = (currentStore.receipt_mode ?? 'ask') === option.value;
                        const saving = savingMode === option.value;
                        const busy = savingMode !== null;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.modeRow,
                                    active && styles.modeRowActive,
                                    busy && !saving && styles.modeRowDim,
                                ]}
                                onPress={() => changeReceiptMode(option.value)}
                                disabled={busy}
                                activeOpacity={0.7}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#111" />
                                ) : (
                                    <View style={[styles.modeRadio, active && styles.modeRadioActive]}>
                                        {active && <View style={styles.modeRadioDot} />}
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={styles.modeLabel}>{option.label}</TextMalet>
                                    <TextMalet style={styles.modeDescription}>
                                        {saving ? 'Guardando…' : option.description}
                                    </TextMalet>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {!isOwner && (
                    <TextMalet style={styles.modeHint}>
                        Solo el dueño puede cambiar la política de recibos.
                    </TextMalet>
                )}
            </View>

            <View style={styles.currencyCard}>
                <View style={styles.cardTitleRow}>
                    <TextMalet style={styles.cardTitle}>Moneda</TextMalet>
                    {savingCurrency && (
                        <ActivityIndicator size="small" color="#111" />
                    )}
                </View>
                <TextMalet style={styles.cardSub}>
                    Todos los montos de la tienda se muestran en esta moneda, sin conversión.
                </TextMalet>
                <View style={styles.currencyRow}>
                    {STORE_CURRENCIES.map((c) => {
                        const active = c === currentCurrency;
                        return (
                            <TouchableOpacity
                                key={c}
                                style={[styles.currencyChip, active && styles.currencyChipActive]}
                                onPress={() => changeCurrency(c)}
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
            </View>

            <StoreNotificationsCard />

            <SalesDefaultRangeCard />

            <TextMalet style={styles.dangerTitle}>Zona peligrosa</TextMalet>

            <View style={styles.dangerCard}>
                <TextMalet style={styles.cardTitle}>Eliminar la tienda</TextMalet>
                <TextMalet style={styles.cardSub}>
                    Eliminación lógica: cualquier miembro puede restaurarla con el aviso de
                    “Deshacer”.
                </TextMalet>
                <Button
                    text="Eliminar tienda"
                    onPress={confirmSoftDelete}
                    style={styles.dangerBtn}
                    labelStyle={styles.dangerLabel}
                />
            </View>

            {isOwner && (
                <View style={styles.dangerCard}>
                    <TextMalet style={styles.cardTitle}>Borrado definitivo</TextMalet>
                    <TextMalet style={styles.cardSub}>
                        Solo el dueño puede hacerlo. Elimina en cascada miembros, productos, métodos
                        de cobro y ventas.
                    </TextMalet>
                    <Button
                        text="Eliminar definitivamente"
                        onPress={confirmHardDelete}
                        style={styles.dangerBtn}
                        labelStyle={styles.dangerLabel}
                    />
                </View>
            )}
            </ScrollView>

            <ModalOptions visible={contactOpen} onClose={() => setContactOpen(false)} heightRatio={0.72}>
                <TextMalet style={styles.modalTitle}>Información de la tienda</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="Teléfono"
                        placeholder="Ej: +58 414-1234567"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <InputField
                        label="Correo"
                        placeholder="Ej: tienda@correo.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <InputField
                        label="Dirección"
                        placeholder="Ej: Av. Principal, local 3"
                        value={address}
                        onChangeText={setAddress}
                        autoCapitalize="sentences"
                    />
                    <TextMalet style={styles.modalHint}>
                        Estos datos aparecen en el recibo. Deja un campo vacío para quitarlo.
                    </TextMalet>
                    <Button text="Guardar" onPress={saveContact} loading={saving} />
                </View>
            </ModalOptions>

            <ModalOptions visible={renameOpen} onClose={() => setRenameOpen(false)} heightRatio={0.45}>
                <TextMalet style={styles.modalTitle}>Renombrar tienda</TextMalet>
                <View style={styles.modalBody}>
                    <InputField
                        label="Nombre de la tienda"
                        placeholder="Ej: Panadería La Espiga"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <Button text="Guardar" onPress={saveRename} loading={saving} />
                </View>
            </ModalOptions>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    scrollContent: {
        gap: 14,
        paddingBottom: 48,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 10,
    },
    cardTexts: {
        flex: 1,
        gap: 3,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cardSub: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    currencyCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    currencyRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
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
    contactRows: {
        gap: 4,
        marginTop: 4,
    },
    contactRow: {
        fontSize: 13,
        color: '#111',
        fontWeight: '600',
    },
    contactRowLabel: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        fontWeight: '500',
    },
    contactBtn: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    modeOptions: {
        gap: 8,
        marginTop: 8,
    },
    modeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    modeRowActive: {
        borderColor: '#111',
        backgroundColor: '#fafafa',
    },
    modeRowDim: {
        opacity: 0.5,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    modeRadio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeRadioActive: {
        borderColor: '#111',
    },
    modeRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#111',
    },
    modeLabel: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    modeDescription: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
        marginTop: 2,
        lineHeight: 16,
    },
    modeHint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 8,
        lineHeight: 16,
    },
    dangerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#dc2626',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 8,
    },
    dangerCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.25)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    dangerBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    dangerLabel: {
        color: '#dc2626',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    modalBody: {
        gap: 14,
    },
    modalHint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
});
