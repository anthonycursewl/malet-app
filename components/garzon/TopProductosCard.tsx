import TextMalet from '@/components/TextMalet/TextMalet';
import { TopProducto } from '@/shared/interfaces/garzon.interfaces';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ModalOptions from '../shared/ModalOptions';

const FLAG_VE = 'https://flagcdn.com/w40/ve.png';
const INITIAL_ITEMS_COUNT = 4;

interface TopProductosCardProps {
    data: TopProducto[];
}

const RANK_STYLES = [
    { bg: '#FEF3C7', text: '#D97706', bar: '#F59E0B' },
    { bg: '#E0E7FF', text: '#4338CA', bar: '#6366F1' },
    { bg: '#FCE7F3', text: '#BE185D', bar: '#EC4899' },
];
const DEFAULT_RANK_STYLE = { bg: '#F3F4F6', text: '#6B7280', bar: '#9CA3AF' };

const getRankStyle = (index: number) => RANK_STYLES[index] ?? DEFAULT_RANK_STYLE;

const FormattedAmount = memo(({ value, prefix = 'Bs', color = '#374151' }: {
    value: number;
    prefix?: string;
    color?: string;
}) => {
    const formatted = value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [intPart, decPart] = formatted.split(',');

    return (
        <View style={styles.amountRow}>
            <TextMalet style={[styles.amountInt, { color }]}>{prefix} {intPart}</TextMalet>
            <TextMalet style={styles.amountDec}>,{decPart}</TextMalet>
        </View>
    );
});

const ProductItem = memo(({ producto, index, maxTotal, onPress }: {
    producto: TopProducto;
    index: number;
    maxTotal: number;
    onPress: (producto: TopProducto, index: number) => void;
}) => {
    const { total, costo, cantidad, ganancia, margenPct, progressWidth } = useMemo(() => {
        const t = parseFloat(producto.total);
        const c = parseFloat(producto.costo);
        const cant = parseInt(producto.cantidad);
        const gan = t - c;
        return {
            total: t,
            costo: c,
            cantidad: cant,
            ganancia: gan,
            margenPct: (gan / t) * 100,
            progressWidth: (t / maxTotal) * 100,
        };
    }, [producto.total, producto.costo, producto.cantidad, maxTotal]);

    const rankStyle = getRankStyle(index);
    const articulo = producto.articulos;

    const handlePress = useCallback(() => {
        onPress(producto, index);
    }, [onPress, producto, index]);

    return (
        <TouchableOpacity
            style={styles.productCard}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.productHeader}>
                <View style={styles.productLeft}>
                    <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
                        <TextMalet style={[styles.rankText, { color: rankStyle.text }]}>
                            {index + 1}
                        </TextMalet>
                    </View>
                    <View style={styles.productDetails}>
                        <TextMalet style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
                            {articulo.descripcion}
                        </TextMalet>
                        <View style={styles.productMeta}>
                            <TextMalet style={styles.productCode} numberOfLines={1}>
                                {articulo.codigo}
                            </TextMalet>
                            <View style={styles.dotSeparator} />
                            <TextMalet style={styles.departmentText} numberOfLines={1}>
                                {articulo.departamento.descripcion}
                            </TextMalet>
                        </View>
                    </View>
                </View>
                <View style={styles.quantityBadge}>
                    <TextMalet style={styles.quantityText}>{cantidad}</TextMalet>
                    <TextMalet style={styles.quantityLabel}>uds</TextMalet>
                </View>
            </View>

            <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progressWidth}%`, backgroundColor: rankStyle.bar }
                        ]}
                    />
                </View>
                <FormattedAmount value={total} color="#10B981" />
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <TextMalet style={styles.statLabel}>Costo</TextMalet>
                    <TextMalet style={styles.statValue}>
                        Bs {costo.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TextMalet>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <TextMalet style={styles.statLabel}>Margen</TextMalet>
                    <TextMalet style={[styles.statValue, margenPct >= 30 ? styles.statValueGood : styles.statValueWarn]}>
                        {margenPct.toFixed(1)}%
                    </TextMalet>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <TextMalet style={styles.statLabel}>Ganancia</TextMalet>
                    <TextMalet style={[styles.statValue, styles.statValueGood]}>
                        Bs {ganancia.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TextMalet>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const ProductDetailModal = memo(({
    visible,
    onClose,
    producto,
    index
}: {
    visible: boolean;
    onClose: () => void;
    producto: TopProducto | null;
    index: number;
}) => {
    const lastProductRef = React.useRef<{ producto: TopProducto; index: number } | null>(null);

    if (producto) {
        lastProductRef.current = { producto, index };
    }
    const displayData = producto ?? lastProductRef.current?.producto;
    const displayIndex = producto ? index : (lastProductRef.current?.index ?? 0);

    if (!displayData) return null;

    const total = parseFloat(displayData.total);
    const costo = parseFloat(displayData.costo);
    const cantidad = parseInt(displayData.cantidad);
    const ganancia = total - costo;
    const margenPct = (ganancia / total) * 100;
    const gananciaPorUnidad = ganancia / cantidad;
    const rankStyle = getRankStyle(displayIndex);
    const articulo = displayData.articulos;

    return (
        <ModalOptions visible={visible} onClose={onClose}>
            <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.modalHeader}>
                    <View style={[styles.modalRankBadge, { backgroundColor: rankStyle.bg }]}>
                        <TextMalet style={[styles.modalRankText, { color: rankStyle.text }]}>
                            #{index + 1}
                        </TextMalet>
                    </View>
                    <View style={styles.modalTitleContainer}>
                        <TextMalet style={styles.modalTitle} numberOfLines={2}>
                            {articulo.descripcion}
                        </TextMalet>
                        <TextMalet style={styles.modalCode}>{articulo.codigo}</TextMalet>
                    </View>
                </View>

                <View style={styles.modalTag}>
                    <TextMalet style={styles.modalTagText}>
                        {articulo.departamento.descripcion}
                    </TextMalet>
                </View>

                <View style={styles.modalQuickStats}>
                    <View style={styles.modalQuickStatItem}>
                        <TextMalet style={styles.modalQuickStatValue}>{cantidad}</TextMalet>
                        <TextMalet style={styles.modalQuickStatLabel}>uds. vendidas</TextMalet>
                    </View>
                    <View style={styles.modalQuickStatDivider} />
                    <View style={styles.modalQuickStatItem}>
                        <View style={styles.modalAmountRow}>
                            <Image source={{ uri: FLAG_VE }} style={styles.modalFlagIcon} />
                            <TextMalet style={[styles.modalQuickStatValue, { color: '#10B981' }]}>
                                {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </TextMalet>
                        </View>
                        <TextMalet style={styles.modalQuickStatLabel}>total vendido</TextMalet>
                    </View>
                </View>

                <View style={styles.modalSection}>
                    <TextMalet style={styles.modalSectionTitle}>Desglose Financiero</TextMalet>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Costo total</TextMalet>
                        <TextMalet style={styles.modalInfoValue}>
                            Bs {costo.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TextMalet>
                    </View>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Ganancia bruta</TextMalet>
                        <TextMalet style={[styles.modalInfoValue, { color: '#059669' }]}>
                            Bs {ganancia.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TextMalet>
                    </View>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Margen de ganancia</TextMalet>
                        <TextMalet style={[styles.modalInfoValue, margenPct >= 30 ? { color: '#059669' } : { color: '#D97706' }]}>
                            {margenPct.toFixed(2)}%
                        </TextMalet>
                    </View>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Ganancia por unidad</TextMalet>
                        <TextMalet style={styles.modalInfoValue}>
                            Bs {gananciaPorUnidad.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TextMalet>
                    </View>
                </View>

                <View style={styles.modalSection}>
                    <TextMalet style={styles.modalSectionTitle}>Información del Artículo</TextMalet>
                    <View style={styles.modalDescriptionContainer}>
                        <TextMalet style={styles.modalDescriptionLabel}>Descripción</TextMalet>
                        <TextMalet style={styles.modalDescriptionText}>
                            {articulo.descripcion}
                        </TextMalet>
                    </View>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Peso</TextMalet>
                        <TextMalet style={styles.modalInfoValue}>{articulo.peso} kg</TextMalet>
                    </View>
                    <View style={styles.modalInfoRow}>
                        <TextMalet style={styles.modalInfoLabel}>Estado</TextMalet>
                        <TextMalet style={[styles.modalInfoValue, { color: articulo.activo ? '#059669' : '#DC2626' }]}>
                            {articulo.activo ? 'Activo' : 'Inactivo'}
                        </TextMalet>
                    </View>
                </View>
            </ScrollView>
        </ModalOptions>
    );
});

const TopProductosCard = memo(({ data }: TopProductosCardProps) => {
    const [showAll, setShowAll] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<{ producto: TopProducto; index: number } | null>(null);

    const visibleData = useMemo(() => {
        return showAll ? data : data.slice(0, INITIAL_ITEMS_COUNT);
    }, [data, showAll]);

    const hasMoreItems = data.length > INITIAL_ITEMS_COUNT;
    const remainingCount = data.length - INITIAL_ITEMS_COUNT;

    const { totalVendido, totalGanancia, maxTotal } = useMemo(() => {
        let vendido = 0;
        let ganancia = 0;
        let max = 0;

        for (const item of data) {
            const total = parseFloat(item.total);
            const costo = parseFloat(item.costo);
            vendido += total;
            ganancia += (total - costo);
            if (total > max) max = total;
        }

        return { totalVendido: vendido, totalGanancia: ganancia, maxTotal: max };
    }, [data]);

    const handleProductPress = useCallback((producto: TopProducto, index: number) => {
        setSelectedProduct({ producto, index });
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedProduct(null);
    }, []);

    const renderItem = useCallback(({ item, index }: { item: TopProducto; index: number }) => (
        <ProductItem
            producto={item}
            index={index}
            maxTotal={maxTotal}
            onPress={handleProductPress}
        />
    ), [maxTotal, handleProductPress]);

    const keyExtractor = useCallback((item: TopProducto) => item.articulos.id.toString(), []);

    const ItemSeparator = useCallback(() => <View style={styles.itemSeparator} />, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <TextMalet style={styles.title}>Top Productos</TextMalet>
                    <TextMalet style={styles.subtitle}>{data.length} productos más vendidos</TextMalet>
                </View>
            </View>

            <FlatList
                data={visibleData}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={ItemSeparator}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={INITIAL_ITEMS_COUNT}
                maxToRenderPerBatch={4}
                windowSize={5}
                getItemLayout={(_, index) => ({
                    length: 130,
                    offset: 130 * index + 12 * index,
                    index,
                })}
            />

            {hasMoreItems && (
                <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAll(!showAll)}
                    activeOpacity={0.7}
                >
                    <TextMalet style={styles.showMoreText}>
                        {showAll ? 'Ver menos' : `Ver ${remainingCount} más`}
                    </TextMalet>
                </TouchableOpacity>
            )}

            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <TextMalet style={styles.summaryLabel}>Total vendido</TextMalet>
                    <FormattedAmount value={totalVendido} color="#10B981" />
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <TextMalet style={styles.summaryLabel}>Ganancia neta</TextMalet>
                    <FormattedAmount value={totalGanancia} color="#059669" />
                </View>
            </View>

            <ProductDetailModal
                visible={selectedProduct !== null}
                onClose={handleCloseModal}
                producto={selectedProduct?.producto ?? null}
                index={selectedProduct?.index ?? 0}
            />
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
    },
    header: {
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
    list: {
        gap: 12,
    },
    itemSeparator: {
        height: 12,
    },
    showMoreButton: {
        alignSelf: 'center',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    showMoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    productCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
    },
    rankBadge: {
        width: 22,
        height: 22,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 11,
        fontWeight: '700',
    },
    productDetails: {
        flex: 1,
        gap: 2,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    productMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    productCode: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB',
    },
    departmentText: {
        fontSize: 10,
        color: '#6B7280',
        flex: 1,
    },
    quantityBadge: {
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    quantityLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        marginTop: -2,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    amountInt: {
        fontSize: 14,
        fontWeight: '700',
    },
    amountDec: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
    },
    statLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginTop: 1,
    },
    statValueGood: {
        color: '#059669',
    },
    statValueWarn: {
        color: '#D97706',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    modalScrollView: {
        maxHeight: 450,
    },
    modalContent: {
        gap: 16,
        paddingBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    modalRankBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalRankText: {
        fontSize: 13,
        fontWeight: '700',
    },
    modalTitleContainer: {
        flex: 1,
        gap: 2,
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalCode: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    modalTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    modalTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4338CA',
    },
    modalDescriptionContainer: {
        gap: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalDescriptionLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    modalDescriptionText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    modalQuickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    modalQuickStatItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    modalQuickStatValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalQuickStatLabel: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    modalQuickStatDivider: {
        width: 1,
        height: 28,
        backgroundColor: '#E5E7EB',
    },
    modalAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    modalFlagIcon: {
        width: 16,
        height: 11,
        borderRadius: 2,
    },
    modalSection: {
        gap: 8,
    },
    modalSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 4,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalInfoLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    modalInfoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
});

export default TopProductosCard;
