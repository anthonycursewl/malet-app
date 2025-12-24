import TextMalet from "@/components/TextMalet/TextMalet";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import IconExchange from "@/svgs/common/IconExchange";
import IconAt from "@/svgs/dashboard/IconAt";
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Keyboard, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CurrencyType = 'USD' | 'BS';

// Utility: Formateador numérico visual (1,234.56)
const formatNumber = (num: string) => {
    if (!num) return '';
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
};

// Utility: Limpiar formato para cálculos
const cleanNumber = (num: string) => num.replace(/,/g, '');

const ShimmerLoader = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const translateX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });
    return (
        <View style={styles.shimmerContainer}>
            {[1, 2, 3].map((item) => (
                <View key={item} style={styles.shimmerBox}>
                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]} />
                </View>
            ))}
        </View>
    );
};

export default function Calculator() {
    const { user } = useAuthStore();
    const { tasas, getTasas } = useWalletStore();

    const [selectedTasaIndex, setSelectedTasaIndex] = useState(0);
    const [fromCurrency, setFromCurrency] = useState<CurrencyType>('USD');
    const [toCurrency, setToCurrency] = useState<CurrencyType>('BS');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [isLoadingTasas, setIsLoadingTasas] = useState(true);

    // Animations
    const swapButtonRotate = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadTasas();
    }, []);

    const loadTasas = async () => {
        setIsLoadingTasas(true);
        await getTasas();
        setIsLoadingTasas(false);
    };

    const getCurrentRate = useCallback(() => {
        return parseFloat(String(tasas?.[selectedTasaIndex]?.promedio || 0));
    }, [tasas, selectedTasaIndex]);

    const lastEditedField = useRef<'from' | 'to'>('from');

    useEffect(() => {
        const rate = getCurrentRate();
        if (rate === 0) return;

        if (lastEditedField.current === 'from' && fromAmount) {
            const numValue = parseFloat(cleanNumber(fromAmount));
            if (!isNaN(numValue)) {
                const result = fromCurrency === 'USD' ? numValue * rate : numValue / rate;
                setToAmount(result.toFixed(2));
            }
        } else if (lastEditedField.current === 'to' && toAmount) {
            const numValue = parseFloat(cleanNumber(toAmount));
            if (!isNaN(numValue)) {
                const result = toCurrency === 'BS' ? numValue / rate : numValue * rate;
                setFromAmount(result.toFixed(2));
            }
        }
    }, [selectedTasaIndex, getCurrentRate, fromCurrency, toCurrency]);

    const handleConvert = useCallback((value: string, isFromInput: boolean) => {
        const rawValue = cleanNumber(value);
        if (!/^\d*\.?\d*$/.test(rawValue)) return;

        lastEditedField.current = isFromInput ? 'from' : 'to';

        const rate = getCurrentRate();
        const numValue = parseFloat(rawValue);

        if (!rawValue || isNaN(numValue) || rate === 0) {
            if (isFromInput) {
                setFromAmount(rawValue);
                setToAmount('');
            } else {
                setToAmount(rawValue);
                setFromAmount('');
            }
            return;
        }

        if (isFromInput) {
            setFromAmount(rawValue);
            const result = fromCurrency === 'USD' ? numValue * rate : numValue / rate;
            setToAmount(result.toFixed(2));
        } else {
            setToAmount(rawValue);
            const result = toCurrency === 'BS' ? numValue / rate : numValue * rate;
            setFromAmount(result.toFixed(2));
        }
    }, [fromCurrency, toCurrency, getCurrentRate]);

    const handleSwapCurrencies = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.timing(swapButtonRotate, { toValue: 1, duration: 300, easing: Easing.elastic(1.5), useNativeDriver: true }),
            Animated.timing(swapButtonRotate, { toValue: 0, duration: 0, useNativeDriver: true }) // Reset visual logic implicitly
        ]).start();

        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
    };

    const copyToClipboard = async (text: string) => {
        if (!text) return;
        await Clipboard.setStringAsync(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Copiado", "Monto copiado al portapapeles");
    };

    const shareCalculation = async () => {
        if (!fromAmount || !toAmount) return;
        const rate = getCurrentRate();
        const tasaName = tasas?.[selectedTasaIndex]?.nombre || 'Tasa';
        try {
            await Share.share({
                message: `💱 Cambio ${tasaName}:\n${formatNumber(fromAmount)} ${fromCurrency} = ${formatNumber(toAmount)} ${toCurrency}\nTasa: ${rate}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const clearAll = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFromAmount('');
        setToAmount('');
        Keyboard.dismiss();
    };

    const rotation = swapButtonRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    if (!user) { router.replace('/'); return null; }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>

                    {/* Header Moderno */}
                    <View style={styles.header}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <IconAt width={24} height={24} fill={'#202020ff'} />
                                <TextMalet style={styles.title}>Calculadora</TextMalet>
                            </View>
                            <TextMalet style={styles.subtitle}>Conversor de divisas en tiempo real</TextMalet>
                        </View>
                        <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
                            <TextMalet style={styles.clearButtonText}>Limpiar</TextMalet>
                        </TouchableOpacity>
                    </View>

                    {/* Selector de Tasas */}
                    <View style={styles.tasaContainer}>
                        {isLoadingTasas ? <ShimmerLoader /> : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tasaScrollContent}>
                                {tasas?.map((tasa, index) => {
                                    const isSelected = selectedTasaIndex === index;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setSelectedTasaIndex(index);
                                            }}
                                            activeOpacity={0.8}
                                            style={[styles.tasaPill, isSelected && styles.tasaPillSelected]}
                                        >
                                            {isSelected && (
                                                <LinearGradient
                                                    colors={['#eef2ff', '#ffffff']}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                />
                                            )}
                                            <View style={styles.tasaContent}>
                                                <View style={[styles.indicatorDot, { backgroundColor: isSelected ? '#4F46E5' : '#d1d5db' }]} />
                                                <View>
                                                    <TextMalet style={[styles.tasaName, isSelected && styles.tasaNameSelected]}>{tasa.nombre}</TextMalet>
                                                    <TextMalet style={[styles.tasaValue, isSelected && styles.tasaValueSelected]}>Bs {tasa.promedio}</TextMalet>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* Main Card */}
                    <View style={styles.cardContainer}>
                        <LinearGradient
                            colors={['#ffffff', '#f8fafc']}
                            style={styles.mainCard}
                        >
                            {/* Input FROM */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <TextMalet style={styles.labelText}>Monto a enviar</TextMalet>
                                    <View style={styles.badge}>
                                        <TextMalet style={styles.badgeText}>{fromCurrency}</TextMalet>
                                    </View>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="decimal-pad"
                                        value={formatNumber(fromAmount)}
                                        onChangeText={(v) => handleConvert(v, true)}
                                    />
                                    {fromAmount.length > 0 && (
                                        <TouchableOpacity onPress={() => copyToClipboard(fromAmount)} style={styles.iconAction}>
                                            <TextMalet style={{ fontSize: 14 }}>❐</TextMalet>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Divider & Swap */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.line} />
                                <TouchableOpacity onPress={handleSwapCurrencies} activeOpacity={0.9} style={styles.swapBtnWrapper}>
                                    <Animated.View style={[styles.swapBtn, { transform: [{ rotate: rotation }] }]}>
                                        <IconExchange stroke="#fff" style={{ width: 20, height: 20 }} />
                                    </Animated.View>
                                </TouchableOpacity>
                                <View style={styles.line} />
                            </View>

                            {/* Input TO */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <TextMalet style={styles.labelText}>Monto a recibir</TextMalet>
                                    <View style={[styles.badge, styles.badgeActive]}>
                                        <TextMalet style={styles.badgeTextActive}>{toCurrency}</TextMalet>
                                    </View>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, styles.inputActive]}
                                        placeholder="0"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="decimal-pad"
                                        value={formatNumber(toAmount)}
                                        onChangeText={(v) => handleConvert(v, false)}
                                    />
                                    {toAmount.length > 0 && (
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity onPress={() => copyToClipboard(toAmount)} style={styles.iconAction}>
                                                <TextMalet style={{ fontSize: 14 }}>❐</TextMalet>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={shareCalculation} style={[styles.iconAction, { marginLeft: 8 }]}>
                                                <TextMalet style={{ fontSize: 14 }}>🔗</TextMalet>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Rate Context Info */}
                    {tasas && (
                        <View style={styles.infoRow}>
                            <TextMalet style={styles.infoText}>
                                Tasa actual: <TextMalet style={{ fontWeight: '700' }}>1 USD = {getCurrentRate()} Bs</TextMalet>
                            </TextMalet>
                            <TextMalet style={styles.infoSource}>Fuente: {tasas[selectedTasaIndex]?.nombre}</TextMalet>
                        </View>
                    )}

                    {/* Quick Grid */}
                    <TextMalet style={styles.sectionHeader}>Referencias rápidas</TextMalet>
                    <View style={styles.gridContainer}>
                        {[1, 5, 10, 20, 50, 100].map((amt) => {
                            const rate = getCurrentRate();
                            const res = fromCurrency === 'USD' ? (amt * rate) : (amt / rate);
                            return (
                                <TouchableOpacity
                                    key={amt}
                                    style={styles.gridItem}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setFromAmount(amt.toString());
                                        handleConvert(amt.toString(), true);
                                    }}
                                >
                                    <TextMalet style={styles.gridFrom}>{amt} {fromCurrency}</TextMalet>
                                    <TextMalet style={styles.gridArrow}>↓</TextMalet>
                                    <TextMalet style={styles.gridTo}>{formatNumber(res.toFixed(2))} {toCurrency}</TextMalet>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    container: { flex: 1 },
    content: { padding: 20 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
    clearButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    clearButtonText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

    // Tasa Selector
    tasaContainer: { marginBottom: 24 },
    tasaScrollContent: { paddingRight: 20 },
    tasaPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, padding: 12, marginRight: 12, minWidth: 130,
        borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden'
    },
    tasaPillSelected: { borderColor: '#4F46E5', elevation: 4, shadowColor: '#4F46E5', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    tasaContent: { flexDirection: 'row', alignItems: 'center' },
    indicatorDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    tasaName: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    tasaNameSelected: { color: '#1e293b' },
    tasaValue: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
    tasaValueSelected: { color: '#4F46E5', fontWeight: '700' },

    // Main Card
    cardContainer: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 2, marginBottom: 20
    },
    mainCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#fff' },
    inputGroup: { marginVertical: 4 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    labelText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeActive: { backgroundColor: '#e0e7ff' },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
    badgeTextActive: { fontSize: 11, fontWeight: '700', color: '#4338ca' },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    input: {
        fontSize: 32, fontWeight: '700', color: '#334155', fontFamily: 'System',
        paddingVertical: 4, flex: 1,
    },
    inputActive: { color: '#1e293b' },
    iconAction: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
    actionRow: { flexDirection: 'row' },

    // Divider
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    line: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
    swapBtnWrapper: { marginHorizontal: 12 },
    swapBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4
    },

    // Info Context
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 24 },
    infoText: { fontSize: 12, color: '#475569' },
    infoSource: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

    // Grid
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: {
        width: '31%', backgroundColor: '#fff', padding: 12, borderRadius: 12,
        alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
    },
    gridFrom: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    gridArrow: { fontSize: 10, color: '#cbd5e1', marginVertical: 2 },
    gridTo: { fontSize: 12, fontWeight: '700', color: '#334155' },

    // Shimmer
    shimmerContainer: { flexDirection: 'row', gap: 10 },
    shimmerBox: { width: 130, height: 50, backgroundColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden' },
    shimmerOverlay: { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' },
});