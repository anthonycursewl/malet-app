import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, ChevronDown, Plus, Sparkles, Trash2, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import CustomerPickerModal from '@/components/cuaderno/CustomerPickerModal';
import { SaleFormSkeleton } from '@/components/cuaderno/Skeletons';
import { currencyOf, formatDateShort, formatMoney, notify } from '@/components/cuaderno/format';
import { Customer, InvoiceInput, SaleItemInput, StoreProduct } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

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

/** Línea del carrito: producto del catálogo o concepto libre (servicio). */
interface CartLine {
    key: string;
    productId: string | null;
    name: string;
    quantity: string;
    unitPrice: string;
    unitCost: string;
}

const conceptKey = () => `concept-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Crear o editar una factura. La factura solo detalla lo que se cobrará: no
 * genera venta ni recibo hasta que el cliente paga (desde el detalle).
 */
export default function InvoiceFormScreen() {
    const { store: storeId, id: invoiceId } = useLocalSearchParams<{
        store: string;
        id?: string;
    }>();
    const isEdit = !!invoiceId;

    const products = useSalesModuleStore((s) => s.products);
    const loadProducts = useSalesModuleStore((s) => s.loadProducts);
    const customers = useSalesModuleStore((s) => s.customers);
    const fetchInvoice = useSalesModuleStore((s) => s.fetchInvoice);
    const createInvoice = useSalesModuleStore((s) => s.createInvoice);
    const updateInvoice = useSalesModuleStore((s) => s.updateInvoice);
    const currency = useSalesModuleStore((s) => currencyOf(s.currentStore));

    const [loading, setLoading] = useState(isEdit);
    const [lines, setLines] = useState<CartLine[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [issuedAt, setIssuedAt] = useState(new Date());
    const [dueAt, setDueAt] = useState<Date | null>(null);
    const [showIssuedPicker, setShowIssuedPicker] = useState(false);
    const [showDuePicker, setShowDuePicker] = useState(false);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [conceptModalOpen, setConceptModalOpen] = useState(false);
    const [conceptName, setConceptName] = useState('');
    const [conceptPrice, setConceptPrice] = useState('');
    const [conceptCost, setConceptCost] = useState('');
    const [conceptQty, setConceptQty] = useState('1');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (products.length === 0 && storeId) loadProducts({ refresh: true });
    }, [products.length, storeId, loadProducts]);

    useEffect(() => {
        if (!invoiceId) return;
        let mounted = true;
        (async () => {
            const { invoice, error } = await fetchInvoice(invoiceId);
            if (!mounted) return;
            if (error || !invoice) {
                notify('error', error ?? 'Factura no encontrada.');
                if (router.canGoBack()) router.back();
                return;
            }
            if (invoice.status !== 'pending') {
                notify('error', 'Solo las facturas pendientes se pueden editar.');
                router.replace({
                    pathname: '/cuaderno/invoice',
                    params: { store: storeId, id: invoice.id },
                } as any);
                return;
            }

            setCustomerId(invoice.customer_id ?? null);
            setCustomerName(invoice.customer_name ?? '');
            setNotes(invoice.notes ?? '');
            setLines(
                invoice.lines.map((line, index) => ({
                    key: line.product_id ?? `concept-${index}`,
                    productId: line.product_id,
                    name: line.name,
                    quantity: String(line.quantity ?? 1),
                    unitPrice: String(line.unit_price ?? ''),
                    unitCost: String(line.unit_cost ?? ''),
                })),
            );
            const issued = new Date(invoice.issued_at);
            if (!Number.isNaN(issued.getTime())) setIssuedAt(issued);
            if (invoice.due_at) {
                const due = new Date(invoice.due_at);
                if (!Number.isNaN(due.getTime())) setDueAt(due);
            }
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [invoiceId, fetchInvoice, storeId]);

    const customer: Customer | null = customerId
        ? (customers.find((c) => c.id === customerId) ?? {
              id: customerId,
              name: 'Cliente',
          })
        : null;

    const lineQty = (line: CartLine) => parseInt(line.quantity, 10) || 0;
    const linePrice = (line: CartLine) => parseDecimal(line.unitPrice);
    const lineCost = (line: CartLine) => parseDecimal(line.unitCost);
    const lineTotal = (line: CartLine) =>
        (Number.isFinite(linePrice(line)) ? linePrice(line) : 0) * lineQty(line);

    const total = lines.reduce((acc, line) => acc + lineTotal(line), 0);

    /** Nombre visible de una línea (con fallback al snapshot si el producto se borró). */
    const lineName = (line: CartLine): string => {
        if (!line.productId) return line.name.trim() || 'Concepto';
        return products.find((p) => p.id === line.productId)?.name ?? (line.name.trim() || 'Producto');
    };

    const addProduct = (product: StoreProduct) => {
        setLines((prev) => {
            const existing = prev.find((line) => line.productId === product.id);
            if (existing) {
                return prev.map((line) =>
                    line.productId === product.id ? { ...line, quantity: String(lineQty(line) + 1) } : line,
                );
            }
            return [
                ...prev,
                {
                    key: product.id,
                    productId: product.id,
                    name: product.name,
                    quantity: '1',
                    unitPrice: String(product.pvp ?? 0),
                    unitCost: String(product.cost ?? 0),
                },
            ];
        });
        setProductModalOpen(false);
        setProductSearch('');
    };

    const addConcept = () => {
        const name = conceptName.trim();
        if (!name) {
            notify('error', 'Escribe el nombre del concepto.');
            return;
        }
        const price = parseDecimal(conceptPrice);
        if (!Number.isFinite(price) || price < 0) {
            notify('error', 'Escribe un precio válido para el concepto.');
            return;
        }
        const cost = conceptCost.trim() ? parseDecimal(conceptCost) : 0;
        if (!Number.isFinite(cost) || cost < 0) {
            notify('error', 'Escribe un costo válido para el concepto.');
            return;
        }
        const qty = parseInt(conceptQty, 10) || 0;
        if (qty < 1) {
            notify('error', 'La cantidad debe ser al menos 1.');
            return;
        }

        setLines((prev) => [
            ...prev,
            {
                key: conceptKey(),
                productId: null,
                name,
                quantity: String(qty),
                unitPrice: String(price),
                unitCost: String(cost),
            },
        ]);
        setConceptName('');
        setConceptPrice('');
        setConceptCost('');
        setConceptQty('1');
        setConceptModalOpen(false);
    };

    const updateLine = (key: string, patch: Partial<CartLine>) => {
        setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
    };

    const removeLine = (key: string) => {
        setLines((prev) => prev.filter((line) => line.key !== key));
    };

    /** Valida el carrito y devuelve las líneas para la API. */
    const buildItems = (): SaleItemInput[] | null => {
        if (lines.length === 0) {
            notify('error', 'Agrega al menos un producto o concepto.');
            return null;
        }

        for (const line of lines) {
            const label = lineName(line);
            if (!line.productId && !line.name.trim()) {
                notify('error', 'Cada concepto necesita un nombre.');
                return null;
            }
            if (lineQty(line) < 1) {
                notify('error', `La cantidad debe ser al menos 1 en ${label}.`);
                return null;
            }
            if (!Number.isFinite(linePrice(line)) || linePrice(line) < 0) {
                notify('error', `Escribe un precio válido para ${label}.`);
                return null;
            }
            if (!Number.isFinite(lineCost(line)) || lineCost(line) < 0) {
                notify('error', `Escribe un costo válido para ${label}.`);
                return null;
            }
        }

        return lines.map((line) => {
            if (line.productId) {
                const exists = products.some((p) => p.id === line.productId);
                if (!exists) {
                    return {
                        name: line.name.trim() || 'Producto',
                        item_type: 'service' as const,
                        quantity: lineQty(line),
                        unit_price: linePrice(line),
                        unit_cost: lineCost(line),
                    };
                }
                return {
                    product_id: line.productId,
                    quantity: lineQty(line),
                    unit_price: linePrice(line),
                    unit_cost: lineCost(line),
                };
            }
            return {
                name: line.name.trim(),
                item_type: 'service' as const,
                quantity: lineQty(line),
                unit_price: linePrice(line),
                unit_cost: lineCost(line),
            };
        });
    };

    const submit = async () => {
        const items = buildItems();
        if (!items) return;

        const body: InvoiceInput = {
            items,
            customer_id: customerId,
            customer_name: customerName.trim() ? customerName.trim() : null,
            notes: notes.trim() ? notes.trim() : null,
            issued_at: issuedAt.toISOString(),
            due_at: dueAt ? dueAt.toISOString() : null,
        };

        setSaving(true);
        if (isEdit && invoiceId) {
            const error = await updateInvoice(invoiceId, body);
            setSaving(false);
            if (error) {
                notify('error', error);
                return;
            }
            notify('success', 'Factura actualizada.');
            router.replace({
                pathname: '/cuaderno/invoice',
                params: { store: storeId, id: invoiceId },
            } as any);
            return;
        }

        const { invoice, error } = await createInvoice(body);
        setSaving(false);
        if (error || !invoice) {
            notify('error', error ?? 'Error al crear la factura');
            return;
        }
        notify('success', `Factura ${invoice.number} creada.`);
        router.replace({
            pathname: '/cuaderno/invoice',
            params: { store: storeId, id: invoice.id },
        } as any);
    };

    const visibleProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.trim().toLowerCase()),
    );

    if (loading) {
        return (
            <LayoutAuthenticated>
                <View style={styles.container}>
                    <View style={styles.headerPad}>
                        <CuadernoHeader title="Editar factura" bleed={19} />
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
                    <CuadernoHeader title={isEdit ? 'Editar factura' : 'Nueva factura'} bleed={19} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Conceptos */}
                    <View style={styles.group}>
                        <View style={styles.productsHeader}>
                            <TextMalet style={styles.label}>Conceptos</TextMalet>
                            {lines.length > 0 && (
                                <TextMalet style={styles.productsCount}>
                                    {lines.length} {lines.length === 1 ? 'concepto' : 'conceptos'}
                                </TextMalet>
                            )}
                        </View>

                        {lines.length === 0 && (
                            <TextMalet style={styles.hintSmall}>
                                Agrega productos del catálogo o servicios libres (sin crear un producto).
                            </TextMalet>
                        )}

                        {lines.map((line) => (
                            <View key={line.key} style={styles.lineCard}>
                                <View style={styles.lineHeader}>
                                    <View style={{ flex: 1 }}>
                                        <TextMalet style={styles.lineTitle} numberOfLines={1}>
                                            {lineName(line)}
                                        </TextMalet>
                                        {!line.productId && (
                                            <TextMalet style={styles.serviceBadge}>Servicio</TextMalet>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeLine(line.key)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Trash2 size={16} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>

                                {!line.productId && (
                                    <InputField
                                        label="Concepto"
                                        placeholder="Ej. Desarrollo de app"
                                        value={line.name}
                                        onChangeText={(text) => updateLine(line.key, { name: text })}
                                    />
                                )}

                                <View style={styles.lineInputs}>
                                    <View style={{ width: 74 }}>
                                        <InputField
                                            label="Cant."
                                            placeholder="1"
                                            value={line.quantity}
                                            onChangeText={(text) =>
                                                updateLine(line.key, {
                                                    quantity: text.replace(/[^0-9]/g, ''),
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
                                            onChangeText={(text) =>
                                                updateLine(line.key, {
                                                    unitPrice: sanitizeDecimal(text),
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
                                            onChangeText={(text) =>
                                                updateLine(line.key, {
                                                    unitCost: sanitizeDecimal(text),
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

                        <View style={styles.addButtons}>
                            <Button
                                text="Agregar producto"
                                icon={<Plus size={15} color="#fff" />}
                                onPress={() => setProductModalOpen(true)}
                                style={styles.addButton}
                            />
                            <Button
                                text="Agregar concepto"
                                icon={<Sparkles size={15} color="#fff" />}
                                onPress={() => setConceptModalOpen(true)}
                                style={styles.addButton}
                            />
                        </View>
                    </View>

                    {/* Cliente */}
                    <InputField
                        label="Cliente (opcional)"
                        placeholder="Seleccionar cliente"
                        value={customer?.name}
                        onPress={() => setCustomerModalOpen(true)}
                        icon={<UserRound size={16} color="#666" />}
                        rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                        onRightIconPress={() => setCustomerModalOpen(true)}
                    />

                    <InputField
                        label="Facturar a (opcional)"
                        placeholder="Nombre en la factura"
                        value={customerName}
                        onChangeText={setCustomerName}
                    />

                    {/* Notas */}
                    <InputField
                        label="Notas (opcional)"
                        placeholder="Alcance, condiciones, etc."
                        value={notes}
                        onChangeText={setNotes}
                    />

                    {/* Fechas */}
                    <InputField
                        label="Fecha de emisión"
                        placeholder="Seleccionar fecha"
                        value={formatDateShort(issuedAt)}
                        onPress={() => setShowIssuedPicker(true)}
                        icon={<Calendar size={16} color="#666" />}
                        rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                        onRightIconPress={() => setShowIssuedPicker(true)}
                    />

                    <InputField
                        label="Vencimiento (opcional)"
                        placeholder="Sin vencimiento"
                        value={dueAt ? formatDateShort(dueAt) : ''}
                        onPress={() => setShowDuePicker(true)}
                        icon={<Calendar size={16} color="#666" />}
                        rightIcon={<ChevronDown size={16} color="rgba(0,0,0,0.35)" />}
                        onRightIconPress={() => setShowDuePicker(true)}
                    />
                    {dueAt && (
                        <TouchableOpacity onPress={() => setDueAt(null)} style={styles.clearDue}>
                            <TextMalet style={styles.clearDueText}>Quitar vencimiento</TextMalet>
                        </TouchableOpacity>
                    )}

                    {showIssuedPicker && (
                        <DateTimePicker
                            value={issuedAt}
                            mode="date"
                            onValueChange={(_, date) => {
                                setShowIssuedPicker(false);
                                setIssuedAt(date);
                            }}
                            onDismiss={() => setShowIssuedPicker(false)}
                        />
                    )}
                    {showDuePicker && (
                        <DateTimePicker
                            value={dueAt ?? issuedAt}
                            mode="date"
                            onValueChange={(_, date) => {
                                setShowDuePicker(false);
                                setDueAt(date);
                            }}
                            onDismiss={() => setShowDuePicker(false)}
                        />
                    )}

                    {/* Total */}
                    <View style={styles.previewCard}>
                        <View style={styles.previewRow}>
                            <TextMalet style={styles.previewLabel}>Total de la factura</TextMalet>
                            <TextMalet style={styles.previewValue}>{formatMoney(total, currency)}</TextMalet>
                        </View>
                        <TextMalet style={styles.hintSmall}>
                            Este documento no genera ingreso ni recibo hasta que se pague.
                        </TextMalet>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        text={isEdit ? 'Guardar cambios' : 'Crear factura'}
                        onPress={submit}
                        loading={saving}
                        style={styles.submitBtn}
                    />
                </View>
            </KeyboardAvoidingView>

            <CustomerPickerModal
                visible={customerModalOpen}
                selectedId={customerId}
                onClose={() => setCustomerModalOpen(false)}
                onSelect={(picked) => {
                    setCustomerId(picked.id);
                    setCustomerName(picked.name);
                    setCustomerModalOpen(false);
                }}
            />

            {/* Selector de producto */}
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
                        <TouchableOpacity key={p.id} style={styles.modalRow} onPress={() => addProduct(p)}>
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
                            No hay productos. Puedes agregar un concepto libre.
                        </TextMalet>
                    )}
                </ScrollView>
            </ModalOptions>

            {/* Concepto libre */}
            <ModalOptions
                visible={conceptModalOpen}
                onClose={() => setConceptModalOpen(false)}
                heightRatio={0.55}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.conceptContent}
                >
                    <View style={styles.conceptHeader}>
                        <TextMalet style={styles.conceptTitle}>Agregar concepto</TextMalet>
                        <TextMalet style={styles.hintSmall}>
                            Para servicios: no se crea nada en el catálogo de productos.
                        </TextMalet>
                    </View>

                    <InputField
                        label="Concepto"
                        placeholder="Ej. Desarrollo de app"
                        value={conceptName}
                        onChangeText={setConceptName}
                    />
                    <View style={styles.lineInputs}>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="Precio"
                                placeholder="0.00"
                                value={conceptPrice}
                                onChangeText={(text) => setConceptPrice(sanitizeDecimal(text))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="Costo (opcional)"
                                placeholder="0.00"
                                value={conceptCost}
                                onChangeText={(text) => setConceptCost(sanitizeDecimal(text))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                    <View style={{ width: 90 }}>
                        <InputField
                            label="Cantidad"
                            placeholder="1"
                            value={conceptQty}
                            onChangeText={(text) => setConceptQty(text.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                        />
                    </View>

                    <Button text="Agregar" onPress={addConcept} style={styles.conceptSubmit} />
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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    lineTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    serviceBadge: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7c3aed',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
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
    addButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    addButton: {
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
    clearDue: {
        alignSelf: 'flex-start',
        paddingVertical: 2,
    },
    clearDueText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#dc2626',
    },
    previewCard: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        marginTop: 4,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    previewLabel: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#444',
    },
    previewValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.4,
    },
    footer: {
        paddingHorizontal: 5,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#fff',
    },
    submitBtn: {
        width: '100%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    conceptContent: {
        gap: 14,
        paddingHorizontal: 6,
        paddingTop: 2,
        paddingBottom: 10,
    },
    conceptHeader: {
        gap: 4,
    },
    conceptTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    conceptSubmit: {
        marginTop: 4,
    },
    modalList: {
        flex: 1,
        marginTop: 4,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        gap: 10,
    },
    modalRowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    modalRowSub: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
    },
    modalCheck: {
        fontSize: 15,
        fontWeight: '700',
        color: '#16a34a',
    },
    modalEmpty: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
        textAlign: 'center',
        marginTop: 24,
    },
});
