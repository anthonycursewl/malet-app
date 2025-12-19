import TextMalet from '@/components/TextMalet/TextMalet';
import { VentasTienda } from '@/shared/interfaces/garzon.interfaces';
import React, { memo, useMemo, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// URLs de banderas
const FLAGS = {
    VE: 'https://flagcdn.com/w40/ve.png',
    US: 'https://flagcdn.com/w40/us.png',
};

type SortOrder = 'desc' | 'asc';

interface TopVentasCardProps {
    data: VentasTienda[];
}

// Componente para mostrar montos con decimales en gris
const FormattedAmount = memo(({ value, currency = '' }: { value: number; currency?: string }) => {
    const formatted = value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [intPart, decPart] = formatted.split(',');

    return (
        <View style={styles.amountContainer}>
            <TextMalet style={styles.amountInt}>{currency}{intPart}</TextMalet>
            <TextMalet style={styles.amountDec}>,{decPart}</TextMalet>
        </View>
    );
});

// Componente individual de tienda (memoizado para mejor rendimiento)
const TiendaItem = memo(({
    tienda,
    index,
    maxSubtotal
}: {
    tienda: VentasTienda;
    index: number;
    maxSubtotal: number;
}) => {
    const subtotal = parseFloat(tienda.subtotal);
    const progressWidth = (subtotal / maxSubtotal) * 100;

    // Colores según posición
    const progressColor = index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : index === 2 ? '#8B5CF6' : '#94A3B8';

    return (
        <View style={styles.tiendaItem}>
            <View style={styles.tiendaHeader}>
                <View style={styles.tiendaInfo}>
                    <View style={[styles.rankBadge, index === 0 && styles.rankBadgeFirst]}>
                        <TextMalet style={[styles.rankText, index === 0 && styles.rankTextFirst]}>
                            #{index + 1}
                        </TextMalet>
                    </View>
                    <View>
                        <TextMalet style={styles.tiendaName}>{tienda.tienda}</TextMalet>
                        <TextMalet style={styles.tiendaCode}>Cód: {tienda.codigo}</TextMalet>
                    </View>
                </View>
                <View style={styles.tiendaStats}>
                    <TextMalet style={styles.facturas}>{tienda.canfac} fact.</TextMalet>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progressWidth}%`, backgroundColor: progressColor },
                        ]}
                    />
                </View>
                <TextMalet style={styles.tiendaAmount}>
                    Bs {subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </TextMalet>
            </View>
        </View>
    );
});

const TopVentasCard = memo(({ data }: TopVentasCardProps) => {
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Memoizar todos los cálculos para evitar recálculos innecesarios
    const { sortedData, totalVentas, totalUSD, totalFacturas, maxSubtotal } = useMemo(() => {
        // Ordenar datos según el orden seleccionado
        const sorted = [...data].sort((a, b) => {
            const subtotalA = parseFloat(a.subtotal);
            const subtotalB = parseFloat(b.subtotal);
            return sortOrder === 'desc' ? subtotalB - subtotalA : subtotalA - subtotalB;
        });

        // Calcular totales en una sola pasada
        let ventas = 0;
        let usd = 0;
        let facturas = 0;
        let max = 0;

        for (const item of data) {
            const subtotal = parseFloat(item.subtotal);
            ventas += subtotal;
            usd += parseFloat(item.subtotal_usd);
            facturas += item.canfac;
            if (subtotal > max) max = subtotal;
        }

        return {
            sortedData: sorted,
            totalVentas: ventas,
            totalUSD: usd,
            totalFacturas: facturas,
            maxSubtotal: max,
        };
    }, [data, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    return (
        <View style={styles.container}>
            {/* Header con filtro */}
            <View style={styles.headerRow}>
                <View>
                    <TextMalet style={styles.title}>Ventas por Tienda</TextMalet>
                    <TextMalet style={styles.subtitle}>{totalFacturas} facturas</TextMalet>
                </View>
                <TouchableOpacity style={styles.sortButton} onPress={toggleSort} activeOpacity={0.7}>
                    <TextMalet style={styles.sortButtonText}>
                        {sortOrder === 'desc' ? '↓ Mayor' : '↑ Menor'}
                    </TextMalet>
                </TouchableOpacity>
            </View>

            {/* Stats minimalistas */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                        <Image source={{ uri: FLAGS.VE }} style={styles.flagIcon} />
                        <TextMalet style={styles.statLabel}>VES</TextMalet>
                    </View>
                    <FormattedAmount value={totalVentas} currency="Bs " />
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                        <Image source={{ uri: FLAGS.US }} style={styles.flagIcon} />
                        <TextMalet style={styles.statLabel}>USD</TextMalet>
                    </View>
                    <FormattedAmount value={totalUSD} currency="$ " />
                </View>
            </View>

            {/* Lista de tiendas ordenada */}
            <View style={styles.list}>
                {sortedData.map((tienda, index) => (
                    <TiendaItem
                        key={tienda.id}
                        tienda={tienda}
                        index={index}
                        maxSubtotal={maxSubtotal}
                    />
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderBottomColor: '#363636ff',
        borderBottomWidth: 1,
        borderTopColor: '#363636ff',
        borderTopWidth: 1,
        borderStyle: 'dashed',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    headerRow: {
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
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    sortButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    flagIcon: {
        width: 18,
        height: 12,
        borderRadius: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    amountInt: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    amountDec: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    list: {
        gap: 16,
    },
    tiendaItem: {
        gap: 8,
    },
    tiendaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tiendaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeFirst: {
        backgroundColor: '#D1FAE5',
    },
    rankText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    rankTextFirst: {
        color: '#059669',
    },
    tiendaName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    tiendaCode: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    tiendaStats: {
        alignItems: 'flex-end',
    },
    facturas: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    tiendaAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        minWidth: 100,
        textAlign: 'right',
    },
});

export default TopVentasCard;
