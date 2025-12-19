import TextMalet from '@/components/TextMalet/TextMalet';
import { TopPago } from '@/shared/interfaces/garzon.interfaces';
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface TopPagosCardProps {
    data: TopPago[];
}

// Colores para los diferentes métodos de pago
const PAYMENT_COLORS = [
    '#10B981', // Verde esmeralda
    '#3B82F6', // Azul
    '#8B5CF6', // Púrpura
    '#F59E0B', // Ámbar
    '#EF4444', // Rojo
    '#EC4899', // Rosa
];

// Componente para mostrar montos con decimales en gris
const FormattedAmount = memo(({ value, size = 'normal' }: { value: number; size?: 'normal' | 'large' }) => {
    const formatted = value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [intPart, decPart] = formatted.split(',');

    const isLarge = size === 'large';

    return (
        <View style={styles.amountContainer}>
            <TextMalet style={isLarge ? styles.amountIntLarge : styles.amountInt}>
                Bs {intPart}
            </TextMalet>
            <TextMalet style={isLarge ? styles.amountDecLarge : styles.amountDec}>
                ,{decPart}
            </TextMalet>
        </View>
    );
});

// Item individual de método de pago (memoizado)
const PaymentItem = memo(({
    item,
    index,
    percentage,
    maxPercentage
}: {
    item: TopPago;
    index: number;
    percentage: number;
    maxPercentage: number;
}) => {
    const color = PAYMENT_COLORS[index % PAYMENT_COLORS.length];
    const barWidth = (percentage / maxPercentage) * 100;

    return (
        <View style={styles.paymentItem}>
            <View style={styles.paymentHeader}>
                <View style={styles.paymentLeft}>
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <TextMalet
                        style={styles.paymentName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.denominacion.descripcion}
                    </TextMalet>
                </View>
                <View style={styles.percentageBadge}>
                    <TextMalet style={styles.percentageText}>{percentage.toFixed(1)}%</TextMalet>
                </View>
            </View>

            <View style={styles.paymentBarRow}>
                <View style={styles.barBackground}>
                    <View
                        style={[
                            styles.barFill,
                            { width: `${barWidth}%`, backgroundColor: color }
                        ]}
                    />
                </View>
                <TextMalet style={styles.paymentAmount} numberOfLines={1}>
                    Bs {parseFloat(item.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </TextMalet>
            </View>
        </View>
    );
});

const TopPagosCard = memo(({ data }: TopPagosCardProps) => {
    // Memoizar cálculos
    const { sortedData, totalGeneral, maxPercentage } = useMemo(() => {
        // Ordenar de mayor a menor
        const sorted = [...data].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

        // Calcular total
        const total = data.reduce((acc, item) => acc + parseFloat(item.total), 0);

        // Calcular porcentaje máximo para escalar las barras
        const maxPct = Math.max(...data.map(item => (parseFloat(item.total) / total) * 100));

        return {
            sortedData: sorted,
            totalGeneral: total,
            maxPercentage: maxPct,
        };
    }, [data]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <TextMalet style={styles.title}>Métodos de Pago</TextMalet>
                    <TextMalet style={styles.subtitle}>{data.length} métodos activos</TextMalet>
                </View>
            </View>

            {/* Barra de distribución visual */}
            <View style={styles.distributionBar}>
                {sortedData.map((item, index) => {
                    const percentage = (parseFloat(item.total) / totalGeneral) * 100;
                    if (percentage < 2) return null; // Ocultar segmentos muy pequeños
                    return (
                        <View
                            key={item.denominacion.id}
                            style={[
                                styles.distributionSegment,
                                {
                                    flex: percentage,
                                    backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
                                },
                            ]}
                        />
                    );
                })}
            </View>

            {/* Lista de métodos de pago */}
            <View style={styles.list}>
                {sortedData.map((item, index) => {
                    const percentage = (parseFloat(item.total) / totalGeneral) * 100;
                    return (
                        <PaymentItem
                            key={item.denominacion.id}
                            item={item}
                            index={index}
                            percentage={percentage}
                            maxPercentage={maxPercentage}
                        />
                    );
                })}
            </View>

            {/* Total recaudado */}
            <View style={styles.totalRow}>
                <TextMalet style={styles.totalLabel}>Total recaudado</TextMalet>
                <FormattedAmount value={totalGeneral} size="large" />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomColor: '#363636ff',
        borderBottomWidth: 1,
        borderTopColor: '#363636ff',
        borderTopWidth: 1,
        borderStyle: 'dashed',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    distributionBar: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
        gap: 2,
    },
    distributionSegment: {
        height: '100%',
        borderRadius: 3,
    },
    list: {
        gap: 14,
    },
    paymentItem: {
        gap: 6,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        marginRight: 8,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    paymentName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    percentageBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    percentageText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    paymentBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    barBackground: {
        flex: 1,
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    paymentAmount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
        minWidth: 85,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    amountInt: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    amountDec: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    amountIntLarge: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
    },
    amountDecLarge: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6EE7B7',
    },
});

export default TopPagosCard;
