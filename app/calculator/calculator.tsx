import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import { currencies } from "@/shared/entities/Currencies";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CurrencyType = 'USD' | 'USDT';

const currencyOptions = currencies.filter(c => c.name === 'USD' || c.name === 'USDT');

// Utility: Formateador numérico visual (1,234.56)
const formatNumber = (num: string) => {
    if (!num) return '';
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
};

// Utility: Limpiar formato para cálculos
const cleanNumber = (num: string) => num.replace(/,/g, '');

const DIGIT_H = 30;
const DIGIT_W = 16;

// Efecto de dígito que "rueda" al cambiar (mismo patrón que el saldo del dashboard)
const RollingDigit = React.memo(({ digit }: { digit: string }) => {
    // Inicia en 0 para que al montarse (primer valor o cambio de dirección) el dígito "suba" animado
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: parseInt(digit, 10) || 0,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, [digit, anim]);

    const translateY = useMemo(
        () => anim.interpolate({
            inputRange: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            outputRange: [0, -DIGIT_H, -2 * DIGIT_H, -3 * DIGIT_H, -4 * DIGIT_H, -5 * DIGIT_H, -6 * DIGIT_H, -7 * DIGIT_H, -8 * DIGIT_H, -9 * DIGIT_H],
        }),
        [anim]
    );

    return (
        <View style={{ width: DIGIT_W, height: DIGIT_H, overflow: 'hidden' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
                {'0123456789'.split('').map(d => (
                    <TextMalet
                        key={d}
                        style={{ fontSize: DIGIT_H, lineHeight: DIGIT_H, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', height: DIGIT_H }}
                    >
                        {d}
                    </TextMalet>
                ))}
            </Animated.View>
        </View>
    );
});

RollingDigit.displayName = 'RollingDigit';

// Número animado: cada dígito rueda al cambiar
const AnimatedNumber = React.memo(({ value }: { value: string }) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            {value.split('').map((char, i) => {
                if (char >= '0' && char <= '9') {
                    return <RollingDigit key={`d-${i}`} digit={char} />;
                }
                return (
                    <TextMalet
                        key={char === '.' ? `dot-${i}` : `sep-${i}`}
                        style={{ fontSize: DIGIT_H, lineHeight: DIGIT_H, fontWeight: '700', color: '#1a1a2e', width: char === '.' ? 8 : 6, textAlign: 'center' }}
                    >
                        {char}
                    </TextMalet>
                );
            })}
        </View>
    );
});

AnimatedNumber.displayName = 'AnimatedNumber';

export default function Calculator() {
    const tasas = useWalletStore(s => s.tasas);
    const getTasas = useWalletStore(s => s.getTasas);

    const [selectedRate, setSelectedRate] = useState<CurrencyType>('USD');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    // true: campo superior = divisa (USD/USDT), inferior = Bs
    // false: campo superior = Bs, inferior = divisa
    const [currencyOnTop, setCurrencyOnTop] = useState(true);
    const [isLoadingTasas, setIsLoadingTasas] = useState(true);
    const [modalCurrencyOpen, setModalCurrencyOpen] = useState(false);

    const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fromInputRef = useRef<TextInput>(null);
    const toInputRef = useRef<TextInput>(null);
    const swapRotate = useRef(new Animated.Value(0)).current;
    const swapRotateValue = useRef(0);

    // Cargar tasas una sola vez
    useEffect(() => {
        let mounted = true;
        (async () => {
            await getTasas();
            if (mounted) setIsLoadingTasas(false);
        })();
        return () => { mounted = false; };
    }, [getTasas]);

    // Tasa dolar oficial
    const dolarRate = useMemo(() => {
        const list = tasas || [];
        return list.find(t => t.fuente === 'oficial') || list.find(t => /d[oó]lar/i.test(t.nombre) && !/paralelo/i.test(t.nombre));
    }, [tasas]);

    // Tasa paralelo
    const paraleloRate = useMemo(() => {
        const list = tasas || [];
        return list.find(t => t.fuente === 'paralelo') || list.find(t => /paralelo/i.test(t.nombre));
    }, [tasas]);

    // Tasa según selector
    const rate = useMemo(() => {
        return (selectedRate === 'USD' ? dolarRate : paraleloRate)?.promedio || 0;
    }, [selectedRate, dolarRate, paraleloRate]);

    const selectedCurrency = useMemo(
        () => currencyOptions.find(c => c.name === selectedRate) ?? currencyOptions[0],
        [selectedRate]
    );

    // Debounce: solo recalcular 250ms después de dejar de escribir
    const convert = useCallback((value: string, isFromInput: boolean) => {
        const rawValue = cleanNumber(value);
        if (!/^\d*\.?\d*$/.test(rawValue)) return;

        setLastEditedField(isFromInput ? 'from' : 'to');

        if (isFromInput) {
            setFromAmount(rawValue);
        } else {
            setToAmount(rawValue);
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (rate === 0 || !rawValue) {
                if (isFromInput) setToAmount('');
                else setFromAmount('');
                return;
            }
            const numValue = parseFloat(rawValue);
            if (isNaN(numValue)) return;

            const isCurrencyField = isFromInput === currencyOnTop;
            const result = isCurrencyField ? numValue * rate : numValue / rate;

            if (isFromInput) {
                setToAmount(result.toFixed(2));
            } else {
                setFromAmount(result.toFixed(2));
            }
        }, 250);
    }, [rate, currencyOnTop]);

    // Limpiar debounce al desmontar
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Recalcular cuando cambia la tasa o la dirección (no al escribir, eso lo hace el debounce)
    useEffect(() => {
        if (rate === 0) return;
        const field = lastEditedField;
        const value = field === 'from' ? fromAmount : toAmount;
        const num = parseFloat(cleanNumber(value));
        if (!value || isNaN(num)) return;

        const isCurrencyField = field === 'from' ? currencyOnTop : !currencyOnTop;
        const result = isCurrencyField ? num * rate : num / rate;

        if (field === 'from') {
            setToAmount(result.toFixed(2));
        } else {
            setFromAmount(result.toFixed(2));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rate, currencyOnTop]);

    const handleSwapCurrencies = useCallback(() => {
        setFromAmount(toAmount);
        setToAmount(fromAmount);
        setCurrencyOnTop(prev => !prev);
        // Gira el icono 180° para dar la ilusión de intercambio
        swapRotateValue.current = swapRotateValue.current >= 180 ? 0 : 180;
        swapRotate.stopAnimation();
        Animated.spring(swapRotate, {
            toValue: swapRotateValue.current,
            tension: 60,
            friction: 5,
            useNativeDriver: true,
        }).start();
    }, [fromAmount, toAmount, swapRotate]);

    const clearAll = useCallback(() => {
        setFromAmount('');
        setToAmount('');
    }, []);

    // Activa la edición en el lado indicado
    const makeEditable = useCallback((side: 'from' | 'to') => {
        setLastEditedField(side);
        setTimeout(() => {
            if (side === 'from') fromInputRef.current?.focus();
            else toInputRef.current?.focus();
        }, 0);
    }, []);

    const handleSelectCurrency = useCallback((name: CurrencyType) => {
        setSelectedRate(name);
        setModalCurrencyOpen(false);
    }, []);

    const swapSpin = swapRotate.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });
    const topIsEditable = lastEditedField === 'from';
    const topLabel = currencyOnTop ? selectedRate : 'Bs';
    const bottomLabel = currencyOnTop ? 'Bs' : selectedRate;

    const renderTopField = () => {
        if (topIsEditable) {
            return (
                <TextInput
                    ref={fromInputRef}
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#c3c3d1"
                    keyboardType="decimal-pad"
                    value={formatNumber(fromAmount)}
                    onChangeText={(v) => convert(v, true)}
                />
            );
        }
        return (
            <Pressable onPress={() => makeEditable('from')} style={styles.displayWrap} hitSlop={8}>
                {fromAmount ? (
                    <AnimatedNumber value={formatNumber(fromAmount)} />
                ) : (
                    <TextMalet style={styles.emptyNumber}>0</TextMalet>
                )}
            </Pressable>
        );
    };

    const renderBottomField = () => {
        if (!topIsEditable) {
            return (
                <TextInput
                    ref={toInputRef}
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#c3c3d1"
                    keyboardType="decimal-pad"
                    value={formatNumber(toAmount)}
                    onChangeText={(v) => convert(v, false)}
                />
            );
        }
        return (
            <Pressable onPress={() => makeEditable('to')} style={styles.displayWrap} hitSlop={8}>
                {toAmount ? (
                    <AnimatedNumber value={formatNumber(toAmount)} />
                ) : (
                    <TextMalet style={styles.emptyNumber}>0</TextMalet>
                )}
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <TextMalet style={styles.title}>Calculadora</TextMalet>
                        <TextMalet style={styles.subtitle}>Conversor de divisas</TextMalet>
                    </View>
                    {(fromAmount || toAmount) ? (
                        <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
                            <TextMalet style={styles.clearButtonText}>Limpiar</TextMalet>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Selector: abre modal para elegir entre Dólar (USD) y Paralelo (USDT) */}
                <TouchableOpacity onPress={() => setModalCurrencyOpen(true)} activeOpacity={0.7} style={styles.currencySelector}>
                    <Image source={{ uri: selectedCurrency.img }} style={styles.currencyFlag} />
                    <View style={styles.currencyInfo}>
                        <TextMalet style={styles.currencyLabel}>
                            {selectedRate === 'USD' ? 'Dólar' : 'Paralelo'}
                        </TextMalet>
                        <TextMalet style={styles.currencySub}>
                            {isLoadingTasas ? 'Cargando...' : `1 ${selectedRate} = Bs ${rate ? rate.toFixed(2) : '—'}`}
                        </TextMalet>
                    </View>
                    <ChevronDown size={20} color="#b0b0c0" />
                </TouchableOpacity>

                {/* Inputs sin caja */}
                <View style={styles.inputsContainer}>
                    {/* Campo superior */}
                    <View style={styles.inputGroup}>
                        {renderTopField()}
                        <TextMalet style={styles.inputLabel}>{topLabel}</TextMalet>
                    </View>

                    {/* Swap */}
                    <View style={styles.dividerContainer}>
                        <TouchableOpacity onPress={handleSwapCurrencies} activeOpacity={0.7} style={styles.swapBtn} hitSlop={8}>
                            <Animated.View style={{ transform: [{ rotate: swapSpin }] }}>
                                <ArrowUpDown size={18} color="#1a1a2e" strokeWidth={2} />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    {/* Campo inferior */}
                    <View style={styles.inputGroup}>
                        {renderBottomField()}
                        <TextMalet style={styles.inputLabel}>{bottomLabel}</TextMalet>
                    </View>
                </View>
            </ScrollView>

            {/* Modal simple para elegir moneda */}
            <ModalOptions
                visible={modalCurrencyOpen}
                onClose={() => setModalCurrencyOpen(false)}
                heightRatio={0.4}
            >
                <TextMalet style={styles.modalTitle}>Elegir moneda</TextMalet>

                {currencyOptions.map(cur => {
                    const isActive = selectedRate === cur.name;
                    const label = cur.name === 'USD' ? 'Dólar' : 'Paralelo';
                    const sub = cur.name === 'USD'
                        ? (dolarRate?.promedio ? `1 USD = Bs ${dolarRate.promedio.toFixed(2)}` : '—')
                        : (paraleloRate?.promedio ? `1 USDT = Bs ${paraleloRate.promedio.toFixed(2)}` : '—');
                    return (
                        <TouchableOpacity
                            key={cur.name}
                            style={styles.modalOption}
                            onPress={() => handleSelectCurrency(cur.name as CurrencyType)}
                            activeOpacity={0.7}
                        >
                            <Image source={{ uri: cur.img }} style={styles.currencyFlag} />
                            <View style={styles.currencyInfo}>
                                <TextMalet style={styles.currencyLabel}>{label}</TextMalet>
                                <TextMalet style={styles.currencySub}>{sub}</TextMalet>
                            </View>
                            {isActive && (
                                <Check size={22} color="#4CAF50" strokeWidth={3} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ModalOptions>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#8888a0', marginTop: 2 },
    clearButton: { paddingHorizontal: 4, paddingVertical: 4 },
    clearButtonText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

    // Selector (sin bordes)
    currencySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },
    currencyFlag: {
        width: 32,
        height: 32,
        borderRadius: 99,
    },
    currencyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    currencyLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    currencySub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

    // Inputs
    inputsContainer: { marginBottom: 8 },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    input: {
        flex: 1,
        fontSize: 30, fontWeight: '700', color: '#1a1a2e',
        paddingVertical: 4,
    },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#b0b0c0', marginLeft: 12 },
    displayWrap: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
    emptyNumber: { fontSize: DIGIT_H, fontWeight: '700', color: '#d8d8e2' },

    // Divider
    dividerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
    swapBtn: {
        width: 40, height: 40,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d8d8e2',
        borderStyle: 'dashed',
        borderRadius: 20,
    },

    // Modal
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1a1a2e',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
});