import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { TrendingUp, TrendingDown, RefreshCw, ArrowRightLeft } from 'lucide-react-native';
import TextMalet from '../TextMalet/TextMalet';
import { LinearGradient } from 'expo-linear-gradient';

interface RateWidgetProps {
    baseCurrency: string;
    targetCurrency: string;
    rate: number | string;
    change?: number; // percentage change
    lastUpdated?: string;
    onRefresh?: () => void;
    style?: StyleProp<ViewStyle>;
}

export default function RateWidget({
    baseCurrency,
    targetCurrency,
    rate,
    change = 0,
    lastUpdated = 'Recién actualizado',
    onRefresh,
    style
}: RateWidgetProps) {
    const isPositive = change >= 0;

    return (
        <View style={[styles.wrapper, style]}>
            <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(245,245,245,0.8)']}
                style={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.currencyPair}>
                        <ArrowRightLeft size={14} color="#666" style={{ marginRight: 6 }} />
                        <TextMalet style={styles.headerText}>
                            {baseCurrency} / {targetCurrency}
                        </TextMalet>
                    </View>
                    
                    {onRefresh && (
                        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <RefreshCw size={14} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.rateContent}>
                    <TextMalet style={styles.rateValue}>{rate}</TextMalet>
                    <View style={[styles.badge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
                        {isPositive ? (
                            <TrendingUp size={12} color="#10B981" />
                        ) : (
                            <TrendingDown size={12} color="#EF4444" />
                        )}
                        <TextMalet style={[styles.badgeText, isPositive ? styles.textPositive : styles.textNegative]}>
                            {isPositive ? '+' : ''}{change}%
                        </TextMalet>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.statusDot} />
                    <TextMalet style={styles.footerText}>{lastUpdated}</TextMalet>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    container: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    currencyPair: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        letterSpacing: 0.5,
    },
    rateContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    rateValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    badgePositive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    badgeNegative: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    textPositive: {
        color: '#10B981',
    },
    textNegative: {
        color: '#EF4444',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    footerText: {
        fontSize: 11,
        color: '#999',
    },
});
