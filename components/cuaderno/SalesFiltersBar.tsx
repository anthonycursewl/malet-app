import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, ChevronDown, Filter, ListFilter } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { SalesDatePreset } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { PRESET_OPTIONS, formatDateShort, toISODate } from './format';
import { useChipScroll } from './useChipScroll';

type ModalKind = null | 'product' | 'payment';

/**
 * Filtros compartidos de /sales, /summary y /series:
 * presets, rango personalizado (from/to) y selectores de producto/método de cobro.
 */
export default function SalesFiltersBar() {
    const salesFilters = useSalesModuleStore((s) => s.salesFilters);
    const setSalesFilters = useSalesModuleStore((s) => s.setSalesFilters);
    const products = useSalesModuleStore((s) => s.products);
    const paymentMethods = useSalesModuleStore((s) => s.paymentMethods);

    const [custom, setCustom] = useState(false);
    const [fromDate, setFromDate] = useState<Date>(() =>
        salesFilters.from
            ? new Date(`${salesFilters.from}T00:00:00`)
            : new Date(Date.now() - 6 * 86400000)
    );
    const [toDate, setToDate] = useState<Date>(() =>
        salesFilters.to ? new Date(`${salesFilters.to}T00:00:00`) : new Date()
    );
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [modal, setModal] = useState<ModalKind>(null);
    const { scrollRef, onViewportLayout, onChipLayout, scrollToChip } = useChipScroll();

    const hasCustomRange =
        custom || (salesFilters.preset == null && (!!salesFilters.from || !!salesFilters.to));

    const applyPreset = (value: SalesDatePreset | 'all') => {
        setCustom(false);
        scrollToChip(value);
        if (value === 'all') setSalesFilters({ preset: null, from: null, to: null });
        else setSalesFilters({ preset: value, from: null, to: null });
    };

    const enableCustom = () => {
        setCustom(true);
        scrollToChip('custom');
        setSalesFilters({
            preset: null,
            from: toISODate(fromDate),
            to: toISODate(toDate),
        });
    };

    const applyDate = (which: 'from' | 'to', date: Date) => {
        if (which === 'from') {
            setFromDate(date);
            setSalesFilters({ preset: null, from: toISODate(date) });
        } else {
            setToDate(date);
            setSalesFilters({ preset: null, to: toISODate(date) });
        }
    };

    const selectedProduct = products.find((p) => p.id === salesFilters.product_id);
    const selectedMethod = paymentMethods.find((m) => m.id === salesFilters.payment_method_id);

    return (
        <View style={styles.wrap}>
            {/* Presets */}
            <ScrollView
                ref={scrollRef}
                onLayout={onViewportLayout}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
            >
                <TouchableOpacity
                    onLayout={onChipLayout('all')}
                    style={[styles.chip, salesFilters.preset == null && !hasCustomRange && styles.chipActive]}
                    onPress={() => applyPreset('all')}
                >
                    <TextMalet style={[styles.chipText, salesFilters.preset == null && !hasCustomRange && styles.chipTextActive]}>
                        Todo
                    </TextMalet>
                </TouchableOpacity>

                {PRESET_OPTIONS.map((opt) => {
                    const active = salesFilters.preset === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onLayout={onChipLayout(opt.value)}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => applyPreset(opt.value)}
                        >
                            <TextMalet style={[styles.chipText, active && styles.chipTextActive]}>
                                {opt.label}
                            </TextMalet>
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    onLayout={onChipLayout('custom')}
                    style={[styles.chip, hasCustomRange && styles.chipActive]}
                    onPress={enableCustom}
                >
                    <TextMalet style={[styles.chipText, hasCustomRange && styles.chipTextActive]}>
                        Personalizado
                    </TextMalet>
                </TouchableOpacity>
            </ScrollView>

            {/* Rango personalizado */}
            {hasCustomRange && (
                <View style={styles.datesRow}>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                        <TextMalet style={styles.dateBtnLabel}>Desde</TextMalet>
                        <TextMalet style={styles.dateBtnValue}>{formatDateShort(fromDate)}</TextMalet>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                        <TextMalet style={styles.dateBtnLabel}>Hasta</TextMalet>
                        <TextMalet style={styles.dateBtnValue}>{formatDateShort(toDate)}</TextMalet>
                    </TouchableOpacity>
                </View>
            )}

            {showFromPicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    maximumDate={toDate}
                    onValueChange={(_, date) => {
                        setShowFromPicker(false);
                        applyDate('from', date);
                    }}
                    onDismiss={() => setShowFromPicker(false)}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    minimumDate={fromDate}
                    onValueChange={(_, date) => {
                        setShowToPicker(false);
                        applyDate('to', date);
                    }}
                    onDismiss={() => setShowToPicker(false)}
                />
            )}

            {/* Producto / método de cobro */}
            <View style={styles.selectorsRow}>
                <TouchableOpacity
                    style={[styles.selector, !!selectedProduct && styles.selectorActive]}
                    onPress={() => setModal('product')}
                    activeOpacity={0.7}
                >
                    <ListFilter
                        size={15}
                        color={selectedProduct ? '#111' : 'rgba(0,0,0,0.4)'}
                    />
                    <View style={styles.selectorTexts}>
                        <TextMalet style={styles.selectorCaption}>Producto</TextMalet>
                        <TextMalet
                            style={[styles.selectorValue, !!selectedProduct && styles.selectorValueActive]}
                            numberOfLines={1}
                        >
                            {selectedProduct ? selectedProduct.name : 'Todos'}
                        </TextMalet>
                    </View>
                    <ChevronDown size={16} color="rgba(0,0,0,0.35)" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.selector, !!selectedMethod && styles.selectorActive]}
                    onPress={() => setModal('payment')}
                    activeOpacity={0.7}
                >
                    <Filter size={15} color={selectedMethod ? '#111' : 'rgba(0,0,0,0.4)'} />
                    <View style={styles.selectorTexts}>
                        <TextMalet style={styles.selectorCaption}>Cobro</TextMalet>
                        <TextMalet
                            style={[styles.selectorValue, !!selectedMethod && styles.selectorValueActive]}
                            numberOfLines={1}
                        >
                            {selectedMethod ? selectedMethod.name : 'Todos'}
                        </TextMalet>
                    </View>
                    <ChevronDown size={16} color="rgba(0,0,0,0.35)" />
                </TouchableOpacity>
            </View>

            <ModalOptions visible={modal === 'product'} onClose={() => setModal(null)} heightRatio={0.6}>
                <View style={styles.modalHeader}>
                    <ListFilter size={18} color="#111" />
                    <View style={{ flex: 1 }}>
                        <TextMalet style={styles.modalTitle}>Filtrar por producto</TextMalet>
                        <TextMalet style={styles.modalSubtitle}>
                            Acota ventas, resumen y gráfica a un producto.
                        </TextMalet>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.modalRow, salesFilters.product_id == null && styles.modalRowSelected]}
                        onPress={() => {
                            setSalesFilters({ product_id: null });
                            setModal(null);
                        }}
                    >
                        <TextMalet
                            style={[
                                styles.modalRowText,
                                salesFilters.product_id == null && styles.modalRowTextSelected,
                            ]}
                        >
                            Todos los productos
                        </TextMalet>
                        {salesFilters.product_id == null && <Check size={16} color="#111" />}
                    </TouchableOpacity>
                    {products.map((p) => {
                        const active = salesFilters.product_id === p.id;
                        return (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.modalRow, active && styles.modalRowSelected]}
                                onPress={() => {
                                    setSalesFilters({ product_id: p.id });
                                    setModal(null);
                                }}
                            >
                                <TextMalet
                                    style={[styles.modalRowText, active && styles.modalRowTextSelected]}
                                    numberOfLines={1}
                                >
                                    {p.name}
                                </TextMalet>
                                {active && <Check size={16} color="#111" />}
                            </TouchableOpacity>
                        );
                    })}
                    {products.length === 0 && (
                        <TextMalet style={styles.modalEmpty}>No hay productos todavía.</TextMalet>
                    )}
                </ScrollView>
            </ModalOptions>

            <ModalOptions visible={modal === 'payment'} onClose={() => setModal(null)} heightRatio={0.6}>
                <View style={styles.modalHeader}>
                    <Filter size={18} color="#111" />
                    <View style={{ flex: 1 }}>
                        <TextMalet style={styles.modalTitle}>Filtrar por cobro</TextMalet>
                        <TextMalet style={styles.modalSubtitle}>
                            Acota ventas, resumen y gráfica a un método de cobro.
                        </TextMalet>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.modalRow,
                            salesFilters.payment_method_id == null && styles.modalRowSelected,
                        ]}
                        onPress={() => {
                            setSalesFilters({ payment_method_id: null });
                            setModal(null);
                        }}
                    >
                        <TextMalet
                            style={[
                                styles.modalRowText,
                                salesFilters.payment_method_id == null && styles.modalRowTextSelected,
                            ]}
                        >
                            Todos los métodos
                        </TextMalet>
                        {salesFilters.payment_method_id == null && <Check size={16} color="#111" />}
                    </TouchableOpacity>
                    {paymentMethods.map((m) => {
                        const active = salesFilters.payment_method_id === m.id;
                        return (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.modalRow, active && styles.modalRowSelected]}
                                onPress={() => {
                                    setSalesFilters({ payment_method_id: m.id });
                                    setModal(null);
                                }}
                            >
                                <TextMalet
                                    style={[
                                        styles.modalRowText,
                                        !m.active && styles.modalRowMuted,
                                        active && styles.modalRowTextSelected,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {m.name}
                                    {!m.active ? ' (inactivo)' : ''}
                                </TextMalet>
                                {active && <Check size={16} color="#111" />}
                            </TouchableOpacity>
                        );
                    })}
                    {paymentMethods.length === 0 && (
                        <TextMalet style={styles.modalEmpty}>No hay métodos de cobro todavía.</TextMalet>
                    )}
                </ScrollView>
            </ModalOptions>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: 10,
    },
    chipsRow: {
        gap: 8,
        paddingRight: 8,
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
    datesRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateBtn: {
        flex: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 2,
    },
    dateBtnLabel: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.4)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    dateBtnValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    selectorsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    selector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    selectorActive: {
        borderColor: 'rgba(0,0,0,0.55)',
    },
    selectorTexts: {
        flex: 1,
    },
    selectorCaption: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectorValue: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#333',
        marginTop: 1,
    },
    selectorValueActive: {
        color: '#111',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    modalSubtitle: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 1,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 10,
        borderRadius: 10,
        gap: 10,
        marginBottom: 2,
    },
    modalRowSelected: {
        backgroundColor: '#f4f4f5',
    },
    modalRowText: {
        fontSize: 14,
        color: '#222',
        flex: 1,
    },
    modalRowTextSelected: {
        fontWeight: '700',
        color: '#111',
    },
    modalRowMuted: {
        color: '#999',
    },
    modalEmpty: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 16,
    },
});
