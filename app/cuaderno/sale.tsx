import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Calendar, ChevronDown, Plus, Trash2, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import CustomerPickerModal from '@/components/cuaderno/CustomerPickerModal';
import { SaleFormSkeleton } from '@/components/cuaderno/Skeletons';
import DeletingOverlay from '@/components/cuaderno/DeletingOverlay';
import SaleProcessingOverlay from '@/components/cuaderno/SaleProcessingOverlay';
import SaleConfirmModal, { SaleDraft } from '@/components/cuaderno/SaleConfirmModal';
import { formatDateShort, currencyOf, formatMoney, notify, notifyUndo } from '@/components/cuaderno/format';
import {
    Customer,
    Sale,
    SaleInput,
    SaleItemInput,
    SaleReceiptInput,
    StoreCurrency,
    StoreProduct,
    STORE_CURRENCIES,
} from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/** Solo dígitos con un punto decimal. */
const sanitizeDecimal = (text: string): string => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    return cleaned;
};

const parseDecimal = (text: string): number => {
    const n = parseFloat(text);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
};

/** Línea del carrito (los importes se editan como texto). */
interface CartLine {
    key: string;
    productId: string;
    quantity: string;
    unitPrice: string;
    unitCost: string;
}

/**
 * Crear o editar una venta (detalle con total y ganancia en vivo,
 * soft-delete con "Deshacer" y hard-delete para el creador).
 */
export default function SaleFormScreen() {
    const { store: storeId, id: saleId } = useLocalSearchParams<{ store: string; id?: string }>();
    const user = useAuthStore((s) => s.user);
    const products = useSalesModuleStore((s) => s.products);
    const loadProducts = useSalesModuleStore((s) => s.loadProducts);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);
    const customers = useSalesModuleStore((s) => s.customers);
    const fetchSale = useSalesModuleStore((s) => s.fetchSale);
    const createSale = useSalesModuleStore((s) => s.createSale);
    const updateSale = useSalesModuleStore((s) => s.updateSale);
    const deleteSale = useSalesModuleStore((s) => s.deleteSale);
    const hardDeleteSale = useSalesModuleStore((s) => s.hardDeleteSale);
    const issueReceipt = useSalesModuleStore((s) => s.issueReceipt);
    const fetchSaleReceipt = useSalesModuleStore((s) => s.fetchSaleReceipt);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));
    const receiptMode = useSalesModuleStore((s) => s.currentStore?.receipt_mode ?? 'ask');

    const isEdit = !!saleId;

    const [loadingSale, setLoadingSale] = useState(isEdit);
    const [sale, setSale] = useState<Sale | null>(null);
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
    /** Carrito: una línea por producto. */
    const [lines, setLines] = useState<CartLine[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [refCurrency, setRefCurrency] = useState<StoreCurrency | null>(null);
    const [refAmount, setRefAmount] = useState('');
    const [soldAt, setSoldAt] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    /** Hay un borrado en curso (velo de carga en pantalla). */
    const [deleting, setDeleting] = useState(false);
    const [draft, setDraft] = useState<SaleDraft | null>(null);
    const [existingReceiptNumber, setExistingReceiptNumber] = useState<string | null>(null);

    const navigation = useNavigation();

    /**
     * Firma del formulario: sirve para saber si hay una venta en progreso.
     * En edición se compara con lo que se cargó, así abrirla no cuenta como cambio.
     */
    const formSignature = JSON.stringify([
        lines,
        paymentMethodId,
        customerId,
        soldAt,
        refCurrency,
        refAmount,
    ]);
    const initialSignature = useRef<string | null>(null);

    useEffect(() => {
        if (!isEdit || loadingSale || initialSignature.current !== null) return;
        initialSignature.current = formSignature;
    }, [isEdit, loadingSale, formSignature]);

    /** Se pone en true cuando salimos a propósito (guardar, eliminar, ...). */
    const allowExit = useRef(false);

    // Si hay una venta en progreso, se pregunta antes de salir.
    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
                if (allowExit.current) return;

                // Se calcula fuera del render: en edición, abrir la venta no cuenta.
                const dirty = isEdit
                    ? initialSignature.current !== null &&
                      formSignature !== initialSignature.current
                    : lines.length > 0;

                if (!dirty) return;

                event.preventDefault();
                Alert.alert(
                    'Venta en progreso',
                    'Si sales ahora se perderán los datos de esta venta. ¿Quieres salir igualmente?',
                    [
                        { text: 'Seguir editando', style: 'cancel' },
                        {
                            text: 'Salir',
                            style: 'destructive',
                            onPress: () => {
                                allowExit.current = true;
                                navigation.dispatch(event.data.action);
                            },
                        },
                    ]
                );
            });

            return unsubscribe;
        }, [navigation, isEdit, formSignature, lines.length])
    );

    useEffect(() => {
        if (products.length === 0 && storeId) loadProducts({ refresh: true });
    }, [products.length, storeId, loadProducts]);

    useEffect(() => {
        if (!saleId) return;
        let mounted = true;
        (async () => {
            const { sale: fetched, error } = await fetchSale(saleId);
            if (!mounted) return;
            if (error || !fetched) {
                Alert.alert('Malet | Error', error ?? 'Venta no encontrada.');
                if (router.canGoBack()) router.back();
                return;
            }
            setSale(fetched);
            // Recibo ya emitido (si la venta tiene uno, no se puede volver a pedir).
            const { receipt: saleReceipt } = await fetchSaleReceipt(saleId);
            if (mounted && saleReceipt) setExistingReceiptNumber(saleReceipt.number);
            if (!mounted) return;
            setPaymentMethodId(fetched.payment_method_id ?? null);
            setCustomerId(fetched.customer_id ?? null);
            setLines(
                (fetched.items ?? []).map((item) => ({
                    key: item.product_id,
                    productId: item.product_id,
                    quantity: String(item.quantity ?? 1),
                    unitPrice: String(item.unit_price ?? ''),
                    unitCost: String(item.unit_cost ?? ''),
                }))
            );
            setRefCurrency(fetched.reference_currency ?? null);
            setRefAmount(
                fetched.reference_amount != null ? String(fetched.reference_amount) : ''
            );
            if (fetched.sold_at) {
                const d = new Date(fetched.sold_at);
                if (!Number.isNaN(d.getTime())) setSoldAt(d);
            }
            setLoadingSale(false);
        })();
        return () => {
            mounted = false;
        };
    }, [saleId, fetchSale, fetchSaleReceipt]);

    const productNameOf = (productId: string): string =>
        products.find((p) => p.id === productId)?.name ?? 'Producto';

    /** Cliente seleccionado (el nombre se resuelve cuando carga la lista). */
    const customer: Customer | null = customerId
        ? customers.find((c) => c.id === customerId) ?? { id: customerId, name: 'Cliente' }
        : null;

    const lineQty = (line: CartLine) => parseInt(line.quantity, 10) || 0;
    const linePrice = (line: CartLine) => parseDecimal(line.unitPrice);
    const lineCost = (line: CartLine) => parseDecimal(line.unitCost);
    const lineTotal = (line: CartLine) =>
        (Number.isFinite(linePrice(line)) ? linePrice(line) : 0) * lineQty(line);
    const lineProfit = (line: CartLine) =>
        ((Number.isFinite(linePrice(line)) ? linePrice(line) : 0) -
            (Number.isFinite(lineCost(line)) ? lineCost(line) : 0)) *
        lineQty(line);

    const total = lines.reduce((acc, line) => acc + lineTotal(line), 0);
    const profit = lines.reduce((acc, line) => acc + lineProfit(line), 0);

    /** Agrega un producto al carrito (si ya está, suma una unidad). */
    const addProduct = (product: StoreProduct) => {
        setLines((prev) => {
            const existing = prev.find((line) => line.productId === product.id);
            if (existing) {
                return prev.map((line) =>
                    line.productId === product.id
                        ? { ...line, quantity: String(lineQty(line) + 1) }
                        : line
                );
            }
            return [
                ...prev,
                {
                    key: product.id,
                    productId: product.id,
                    quantity: '1',
                    unitPrice: String(product.pvp ?? 0),
                    unitCost: String(product.cost ?? 0),
                },
            ];
        });
        setProductModalOpen(false);
        setProductSearch('');
    };

    const updateLine = (productId: string, patch: Partial<CartLine>) => {
        setLines((prev) =>
            prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line))
        );
    };

    const removeLine = (productId: string) => {
        setLines((prev) => prev.filter((line) => line.productId !== productId));
    };

    /** Valida el carrito y devuelve las líneas para la API (o null si hay error). */
    const buildItems = (): SaleItemInput[] | null => {
        if (lines.length === 0) {
            notify('error', 'Agrega al menos un producto a la venta.');
            return null;
        }

        for (const line of lines) {
            if (lineQty(line) < 1) {
                notify('error', 'La cantidad debe ser al menos 1 en cada producto.');
                return null;
            }
            if (!Number.isFinite(linePrice(line)) || linePrice(line) < 0) {
                notify('error', `Escribe un precio válido para ${productNameOf(line.productId)}.`);
                return null;
            }
            if (!Number.isFinite(lineCost(line)) || lineCost(line) < 0) {
                notify('error', `Escribe un costo válido para ${productNameOf(line.productId)}.`);
                return null;
            }
        }

        return lines.map((line) => ({
            product_id: line.productId,
            quantity: lineQty(line),
            unit_price: linePrice(line),
            unit_cost: lineCost(line),
        }));
    };

    const openNumericPicker = () => setShowDatePicker(true);

    const submit = async () => {
        if (!buildItems()) return;

        const refText = refAmount.trim();
        const hasRefCurrency = refCurrency != null;
        const hasRefAmount = refText.length > 0;
        if (hasRefCurrency !== hasRefAmount) {
            notify('error', 'Completa la moneda y el importe de la referencia, o quita ambas.');
            return;
        }
        const refValue = hasRefAmount ? parseDecimal(refText) : NaN;
        if (hasRefAmount && (!Number.isFinite(refValue) || refValue < 0)) {
            notify('error', 'Escribe un importe de referencia válido.');
            return;
        }

        setDraft({
            items: lines.map((line) => ({
                productName: productNameOf(line.productId),
                quantity: lineQty(line),
                unitPrice: linePrice(line),
                unitCost: lineCost(line),
                total: lineTotal(line),
            })),
            paymentMethodName: paymentMethodId
                ? paymentMethods.find((m) => m.id === paymentMethodId)?.name ?? null
                : null,
            customerName: customer?.name ?? null,
            soldAtLabel: formatDateShort(soldAt),
            total,
            profit,
            currency,
            referenceCurrency: hasRefCurrency && hasRefAmount ? refCurrency : null,
            referenceAmount: hasRefCurrency && hasRefAmount ? refValue : null,
        });
        setConfirmOpen(true);
    };

    /** Ejecuta el registro/actualización ya confirmado en el modal. */
    const performSave = async (receipt: SaleReceiptInput) => {
        const items = buildItems();
        if (!items) return;

        // La política de la tienda manda (defensa extra al backend).
        const wantsReceipt =
            receiptMode === 'always'
                ? true
                : receiptMode === 'never'
                  ? false
                  : receipt.enabled;

        const refText = refAmount.trim();
        const hasRefCurrency = refCurrency != null;
        const hasRefAmount = refText.length > 0;

        const body: SaleInput = {
            items,
            payment_method_id: paymentMethodId,
            customer_id: customer?.id ?? null,
            sold_at: soldAt.toISOString(),
        };
        if (hasRefCurrency && hasRefAmount) {
            body.reference_currency = refCurrency;
            body.reference_amount = parseDecimal(refText);
        } else if (isEdit && saleHasReference) {
            body.reference_currency = null;
            body.reference_amount = null;
        }

        setSaving(true);
        // El modal de confirmación se cierra: el velo de "Procesando..." toma la pantalla.
        setConfirmOpen(false);

        if (isEdit && saleId) {
            // Actualiza la venta y, si corresponde, emite su recibo aparte.
            const err = await updateSale(saleId, body);
            if (err) {
                setSaving(false);
                notify('error', err);
                return;
            }
            if (wantsReceipt) {
                const { error: receiptErr } = await issueReceipt(saleId, {
                    ...(receipt.customer_name ? { customer_name: receipt.customer_name } : {}),
                });
                setSaving(false);
                if (receiptErr) {
                    notify('error', receiptErr);
                    return;
                }
                notify('success', 'Venta actualizada y recibo emitido.');
            } else {
                setSaving(false);
                notify('success', 'Venta actualizada.');
            }
            setConfirmOpen(false);
            allowExit.current = true;
            router.back();
            return;
        }

        const err = await createSale({
            ...body,
            ...(wantsReceipt ? { receipt } : {}),
        });
        setSaving(false);
        if (err) {
            notify('error', err);
            return;
        }
        setConfirmOpen(false);
        notify('success', 'Venta registrada.');
        allowExit.current = true;
        router.dismissTo(`/cuaderno/store?store=${storeId}` as any);
    };

    const confirmSoftDelete = () => {
        if (!saleId) return;
        Alert.alert('Eliminar venta', '¿Deseas eliminar esta venta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setDeleting(true);
                    try {
                        const err = await deleteSale(saleId);
                        if (err) {
                            notify('error', err);
                            return;
                        }
                        notifyUndo('Venta eliminada.', async () => {
                            const { restoreSale } = useSalesModuleStore.getState();
                            const restoreErr = await restoreSale(saleId);
                            if (restoreErr) notify('error', restoreErr);
                        });
                        // El detalle deja de existir: volvemos directo al panel de la tienda.
                        allowExit.current = true;
                        router.dismissTo('/cuaderno/store' as any);
                    } finally {
                        setDeleting(false);
                    }
                },
            },
        ]);
    };

    const confirmHardDelete = () => {
        if (!saleId) return;
        Alert.alert(
            'Eliminar definitivamente',
            'Esta venta se borrará para siempre. No se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const err = await hardDeleteSale(saleId);
                            if (err) {
                                notify('error', err);
                                return;
                            }
                            notify('success', 'Venta eliminada definitivamente.');
                            // El detalle deja de existir: volvemos directo al panel de la tienda.
                            allowExit.current = true;
                            router.dismissTo('/cuaderno/store' as any);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const canHardDelete = !!sale && (sale.created_by ?? null) === user?.id;
    const saleHasReference =
        !!sale && (sale.reference_currency != null || sale.reference_amount != null);
    const activeMethods = paymentMethods.filter((m) => m.active || m.id === paymentMethodId);
    const visibleProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.trim().toLowerCase())
    );

    if (loadingSale) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    <View style={styles.headerPad}>
                        <CuadernoHeader
                            title={isEdit ? 'Editar venta' : 'Nueva venta'}
                            bleed={19}
                        />
                    </View>
                    <SaleFormSkeleton />
                </View>
            </LayoutAuthenticated>
        );
    }

    return (
        <LayoutAuthenticated>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View style={styles.headerPad}>
                    <CuadernoHeader title={isEdit ? 'Editar venta' : 'Nueva venta'} bleed={19} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Productos (carrito) */}
                    <View style={styles.group}>
                        <View style={styles.productsHeader}>
                            <TextMalet style={styles.label}>Productos</TextMalet>
                            {lines.length > 0 && (
                                <TextMalet style={styles.productsCount}>
                                    {lines.length} {lines.length === 1 ? 'producto' : 'productos'}
                                </TextMalet>
                            )}
                        </View>

                        {lines.length === 0 && (
                            <TextMalet style={styles.hintSmall}>
                                Agrega uno o varios productos a la venta.
                            </TextMalet>
                        )}

                        {lines.map((line) => (
                            <View key={line.key} style={styles.lineCard}>
                                <View style={styles.lineHeader}>
                                    <TextMalet style={styles.lineTitle} numberOfLines={1}>
                                        {productNameOf(line.productId)}
                                    </TextMalet>
                                    <TouchableOpacity
                                        onPress={() => removeLine(line.productId)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Trash2 size={16} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.lineInputs}>
                                    <View style={{ width: 74 }}>
                                        <InputField
                                            label="Cant."
                                            placeholder="1"
                                            value={line.quantity}
                                            onChangeText={(t) =>
                                                updateLine(line.productId, {
                                                    quantity: t.replace(/[^0-9]/g, ''),
                                                })
                                            }
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <InputField
                                            label="Precio"
                                            placeholder="0.00"
                                            value={line.unitPrice}
                                            onChangeText={(t) =>
                                                updateLine(line.productId, {
                                                    unitPrice: sanitizeDecimal(t),
                                                })
                                            }
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <InputField
                                            label="Costo"
                                            placeholder="0.00"
                                            value={line.unitCost}
                                            onChangeText={(t) =>
                                                updateLine(line.productId, {
                                                    unitCost: sanitizeDecimal(t),
                                                })
                                            }
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                </View>

                                <TextMalet style={styles.lineTotal}>
                                    {formatMoney(lineTotal(line), currency)}
                                </TextMalet>
                            </View>
                        ))}

                        <Button
                            text="Agregar producto"
                            icon={<Plus size={15} color="#fff" />}
                            onPress={() => setProductModalOpen(true)}
                            style={styles.addProductBtn}
                        />
                    </View>

                    {/* Método de cobro */}
                    <View style={styles.group}>
                        <TextMalet style={styles.label}>Método de cobro (opcional)</TextMalet>
                        <View style={styles.chipsRow}>
                            <TouchableOpacity
                                style={[styles.chip, paymentMethodId == null && styles.chipActive]}
                                onPress={() => setPaymentMethodId(null)}
                            >
                                <TextMalet
                                    style={[styles.chipText, paymentMethodId == null && styles.chipTextActive]}
                                >
                                    Sin método
                                </TextMalet>
                            </TouchableOpacity>
                            {activeMethods.map((m) => {
                                const active = paymentMethodId === m.id;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setPaymentMethodId(active ? null : m.id)}
                                    >
                                        <TextMalet
                                            style={[styles.chipText, active && styles.chipTextActive]}
                                        >
                                            {m.name}
                                        </TextMalet>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Cliente (opcional) */}
                    <InputField
                        label="Cliente (opcional)"
                        placeholder="Seleccionar cliente"
                        value={customer?.name}
                        onPress={() => setCustomerModalOpen(true)}
                        icon={<UserRound size={16} color="#666" />}
                        rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                        onRightIconPress={() => setCustomerModalOpen(true)}
                    />

                    {/* Referencia en otra moneda (informativa) */}
                    <View style={styles.group}>
                        <TextMalet style={styles.label}>Referencia en otra moneda (opcional)</TextMalet>
                        <TextMalet style={styles.hintSmall}>
                            Solo informativa: no cambia la moneda de la tienda ni los totales.
                        </TextMalet>
                        <View style={styles.chipsRow}>
                            {STORE_CURRENCIES.map((c) => {
                                const active = refCurrency === c;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => {
                                            setRefCurrency(active ? null : c);
                                            if (active) setRefAmount('');
                                        }}
                                    >
                                        <TextMalet
                                            style={[styles.chipText, active && styles.chipTextActive]}
                                        >
                                            {c}
                                        </TextMalet>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {refCurrency && (
                            <InputField
                                label={`Importe en ${refCurrency}`}
                                placeholder="0.00"
                                value={refAmount}
                                onChangeText={(t) => setRefAmount(sanitizeDecimal(t))}
                                keyboardType="decimal-pad"
                            />
                        )}
                    </View>

                    {/* Fecha */}
                    <InputField
                        label="Fecha de venta"
                        placeholder="Seleccionar fecha"
                        value={formatDateShort(soldAt)}
                        onPress={openNumericPicker}
                        icon={<Calendar size={16} color="#666" />}
                        rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                        onRightIconPress={openNumericPicker}
                    />

                    {showDatePicker && (
                        <DateTimePicker
                            value={soldAt}
                            mode="date"
                            onValueChange={(_, date) => {
                                setShowDatePicker(false);
                                setSoldAt(date);
                            }}
                            onDismiss={() => setShowDatePicker(false)}
                        />
                    )}

                    {/* Preview */}
                    <View style={styles.previewCard}>
                        <View style={styles.previewRow}>
                            <TextMalet style={styles.previewLabel}>Total</TextMalet>
                            <TextMalet style={styles.previewValue}>
                                {formatMoney(total, currency)}
                            </TextMalet>
                        </View>
                        <View style={styles.previewDivider} />
                        <View style={styles.previewRow}>
                            <TextMalet style={styles.previewLabel}>Ganancia</TextMalet>
                            <TextMalet
                                style={[
                                    styles.previewValue,
                                    { color: profit >= 0 ? '#16a34a' : '#dc2626' },
                                ]}
                            >
                                {formatMoney(profit, currency)}
                            </TextMalet>
                        </View>
                        {refCurrency && refAmount.trim().length > 0 && (
                            <>
                                <View style={styles.previewDivider} />
                                <View style={styles.previewRow}>
                                    <TextMalet style={styles.previewLabel}>
                                        Referencia (informativa)
                                    </TextMalet>
                                    <TextMalet style={styles.previewReference}>
                                        ≈ {formatMoney(parseDecimal(refAmount) || 0, refCurrency)}
                                    </TextMalet>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        text={isEdit ? 'Guardar cambios' : 'Registrar venta'}
                        onPress={submit}
                        loading={saving}
                        style={styles.submitBtn}
                    />
                    {isEdit && (
                        <View style={styles.deleteRow}>
                            <Button
                                text="Eliminar venta"
                                onPress={confirmSoftDelete}
                                loading={deleting}
                                style={styles.deleteBtn}
                                labelStyle={styles.deleteLabel}
                            />
                            {canHardDelete && (
                                <Button
                                    text="Eliminar definitivamente"
                                    onPress={confirmHardDelete}
                                    loading={deleting}
                                    style={styles.deleteBtn}
                                    labelStyle={styles.deleteLabel}
                                />
                            )}
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>

            <SaleConfirmModal
                visible={confirmOpen}
                draft={draft}
                submitting={saving}
                existingReceiptNumber={existingReceiptNumber}
                receiptMode={receiptMode}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={performSave}
            />

            <CustomerPickerModal
                visible={customerModalOpen}
                selectedId={customerId}
                onClose={() => setCustomerModalOpen(false)}
                onSelect={(picked) => {
                    setCustomerId(picked.id);
                    setCustomerModalOpen(false);
                }}
            />

            <SaleProcessingOverlay visible={saving} />

            <DeletingOverlay visible={deleting} label="Eliminando venta…" />

            <ModalOptions
                visible={productModalOpen}
                onClose={() => {
                    setProductModalOpen(false);
                    setProductSearch('');
                }}
                heightRatio={0.7}
            >
                <TextMalet style={styles.modalTitle}>Seleccionar producto</TextMalet>
                <InputField
                    label="Buscar"
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChangeText={setProductSearch}
                    autoCapitalize="none"
                />
                <ScrollView
                    style={styles.modalList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {visibleProducts.map((p) => (
                        <TouchableOpacity
                            key={p.id}
                            style={styles.modalRow}
                            onPress={() => addProduct(p)}
                        >
                            <View style={{ flex: 1 }}>
                                <TextMalet style={styles.modalRowTitle}>{p.name}</TextMalet>
                                <TextMalet style={styles.modalRowSub}>
                                    PVP {formatMoney(Number(p.pvp ?? 0), currency)} · Costo{' '}
                                    {formatMoney(Number(p.cost ?? 0), currency)}
                                </TextMalet>
                            </View>
                            {lines.some((line) => line.productId === p.id) && (
                                <TextMalet style={styles.modalCheck}>✓</TextMalet>
                            )}
                        </TouchableOpacity>
                    ))}
                    {visibleProducts.length === 0 && (
                        <TextMalet style={styles.modalEmpty}>
                            No hay productos. Crea uno en la pestaña “Productos”.
                        </TextMalet>
                    )}
                </ScrollView>
            </ModalOptions>
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
        paddingBottom: 40,
        gap: 16,
    },
    headerPad: {
        paddingHorizontal: 5,
    },
    group: {
        gap: 8,
    },
    productsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    productsCount: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.4)',
    },
    lineCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 10,
        gap: 8,
    },
    lineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    lineTitle: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    lineInputs: {
        flexDirection: 'row',
        gap: 8,
    },
    lineTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
        textAlign: 'right',
    },
    addProductBtn: {
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },
    hintSmall: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        lineHeight: 16,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    chipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    chipText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
    },
    chipTextActive: {
        color: '#fff',
    },
    previewCard: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        gap: 10,
        marginTop: 4,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    previewLabel: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.5)',
        fontWeight: '600',
    },
    previewValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.4,
    },
    previewReference: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.5)',
    },
    previewDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    footer: {
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        backgroundColor: 'white',
        gap: 10,
    },
    submitBtn: {
        width: '100%',
    },
    deleteRow: {
        gap: 8,
    },
    deleteBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
        width: '100%',
    },
    deleteLabel: {
        color: '#dc2626',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12,
    },
    modalList: {
        marginTop: 12,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        gap: 10,
    },
    modalRowTitle: {
        fontSize: 14.5,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    modalRowSub: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
    },
    modalCheck: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
    modalEmpty: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 19,
    },
});
