import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import { currencyOf, formatMoney, notify, notifyUndo } from '@/components/cuaderno/format';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/** Solo dígitos con un punto decimal. */
const sanitizeDecimal = (text: string): string => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    return cleaned;
};

/**
 * Crear o editar un producto (name, cost, pvp).
 * En modo edición: soft-delete con "Deshacer" y hard-delete (solo el creador;
 * el backend responde 409 si el producto tiene ventas).
 */
export default function ProductFormScreen() {
    const { id: productId } = useLocalSearchParams<{ store: string; id?: string }>();
    const user = useAuthStore((s) => s.user);
    const products = useSalesModuleStore((s) => s.products);
    const createProduct = useSalesModuleStore((s) => s.createProduct);
    const updateProduct = useSalesModuleStore((s) => s.updateProduct);
    const deleteProduct = useSalesModuleStore((s) => s.deleteProduct);
    const restoreProduct = useSalesModuleStore((s) => s.restoreProduct);
    const hardDeleteProduct = useSalesModuleStore((s) => s.hardDeleteProduct);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const isEdit = !!productId;
    const existing = isEdit ? products.find((p) => p.id === productId) : undefined;

    const [name, setName] = useState(existing?.name ?? '');
    const [cost, setCost] = useState(existing ? String(existing.cost ?? '') : '');
    const [pvp, setPvp] = useState(existing ? String(existing.pvp ?? '') : '');
    const [saving, setSaving] = useState(false);

    const parsedCost = parseFloat(cost);
    const parsedPvp = parseFloat(pvp);
    const margin =
        Number.isFinite(parsedCost) && Number.isFinite(parsedPvp) ? parsedPvp - parsedCost : null;

    const submit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe el nombre del producto.');
            return;
        }
        if (!Number.isFinite(parsedCost) || parsedCost < 0) {
            notify('error', 'Escribe un costo válido (>= 0).');
            return;
        }
        if (!Number.isFinite(parsedPvp) || parsedPvp < 0) {
            notify('error', 'Escribe un PVP válido (>= 0).');
            return;
        }

        setSaving(true);
        const body = { name: trimmed, cost: parsedCost, pvp: parsedPvp };
        const err = isEdit && productId
            ? await updateProduct(productId, body)
            : await createProduct(body);
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        notify('success', isEdit ? 'Producto actualizado.' : 'Producto creado.');
        if (router.canGoBack()) router.back();
    };

    const confirmSoftDelete = () => {
        if (!productId || !existing) return;
        Alert.alert('Eliminar producto', `¿Deseas eliminar "${existing.name}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    const err = await deleteProduct(productId);
                    if (err) {
                        notify('error', err);
                        return;
                    }
                    notifyUndo('Producto eliminado.', async () => {
                        const restoreErr = await restoreProduct(productId);
                        if (restoreErr) notify('error', restoreErr);
                    });
                    if (router.canGoBack()) router.back();
                },
            },
        ]);
    };

    const confirmHardDelete = () => {
        if (!productId || !existing) return;
        Alert.alert(
            'Eliminar definitivamente',
            `¿Eliminar "${existing.name}" para siempre? Si tiene ventas registradas el backend responde 409 y no se elimina.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const err = await hardDeleteProduct(productId);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notify('success', 'Producto eliminado definitivamente.');
                        if (router.canGoBack()) router.back();
                    },
                },
            ]
        );
    };

    const canHardDelete = !!existing && (existing.created_by ?? null) === user?.id;

    return (
        <LayoutAuthenticated>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View style={styles.headerPad}>
                    <CuadernoHeader title={isEdit ? 'Editar producto' : 'Nuevo producto'} bleed={19} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    <InputField
                        label="Nombre"
                        placeholder="Ej: Café americano"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <View style={styles.row2}>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label={`Costo (${currency})`}
                                placeholder="0.00"
                                value={cost}
                                onChangeText={(t) => setCost(sanitizeDecimal(t))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label={`PVP (${currency})`}
                                placeholder="0.00"
                                value={pvp}
                                onChangeText={(t) => setPvp(sanitizeDecimal(t))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {margin !== null && (
                        <View style={styles.marginCard}>
                            <TextMalet style={styles.marginLabel}>Margen por unidad</TextMalet>
                            <TextMalet
                                style={[
                                    styles.marginValue,
                                    { color: margin >= 0 ? '#16a34a' : '#dc2626' },
                                ]}
                            >
                                {formatMoney(margin, currency)}
                            </TextMalet>
                        </View>
                    )}

                    <Button
                        text={isEdit ? 'Guardar cambios' : 'Crear producto'}
                        onPress={submit}
                        loading={saving}
                        style={styles.submitBtn}
                    />

                    {isEdit && existing && (
                        <View style={styles.dangerZone}>
                            <Button
                                text="Eliminar producto"
                                onPress={confirmSoftDelete}
                                style={styles.dangerBtn}
                                labelStyle={styles.dangerLabel}
                            />
                            {canHardDelete && (
                                <Button
                                    text="Eliminar definitivamente"
                                    onPress={confirmHardDelete}
                                    style={styles.dangerBtn}
                                    labelStyle={styles.dangerLabel}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        paddingHorizontal: 5,
        paddingBottom: 120,
        gap: 16,
    },
    headerPad: {
        paddingHorizontal: 5,
    },
    row2: {
        flexDirection: 'row',
        gap: 12,
    },
    marginCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    marginLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
    marginValue: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    submitBtn: {
        width: '100%',
        marginTop: 4,
    },
    dangerZone: {
        gap: 8,
        marginTop: 8,
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
