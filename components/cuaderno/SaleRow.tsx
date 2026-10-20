import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import {
    Sale,
    saleProfit,
    saleTotal,
    saleUnits,
    StoreCurrency,
} from '@/shared/entities/SalesModule';
import { formatMoney, formatSaleDate } from './format';

interface SaleRowProps {
    sale: Sale;
    paymentMethodName?: string;
    currency: StoreCurrency;
    onPress: () => void;
}

/**
 * Fila de una venta: producto(s), fecha, cobro, total, ganancia y la
 * equivalencia en la moneda de referencia cuando la tiene.
 *
 * Va con `memo`: la lista solo re-renderiza la fila cuando cambian sus datos
 * (el `onPress` del padre se memoiza con `useCallback`).
 */
function SaleRow({ sale, paymentMethodName, currency, onPress }: SaleRowProps) {
    const items = sale.items ?? [];
    const first = items[0];
    const extra = items.length - 1;
    const units = saleUnits(sale);
    const baseName = first?.name ?? first?.product_name ?? 'Producto';
    const title =
        extra > 0
            ? `${baseName} +${extra} ${extra === 1 ? 'producto' : 'productos'}`
            : baseName;
    const hasReference =
        sale.reference_currency != null && sale.reference_amount != null;

    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
                <TextMalet style={styles.rowTitle} numberOfLines={1}>
                    {title}
                    {extra === 0 && units > 1 ? ` ×${units}` : ''}
                </TextMalet>
                <TextMalet style={styles.rowSub} numberOfLines={1}>
                    {formatSaleDate(sale.sold_at)}
                    {paymentMethodName ? ` · ${paymentMethodName}` : ''}
                    {extra > 0 ? ` · ${units} uds` : ''}
                </TextMalet>
            </View>

            <View style={styles.rowRight}>
                <TextMalet style={styles.rowTotal}>
                    {formatMoney(saleTotal(sale), currency)}
                </TextMalet>
                <TextMalet style={styles.rowProfit}>
                    +{formatMoney(saleProfit(sale), currency)}
                </TextMalet>
                {hasReference && (
                    <TextMalet style={styles.rowReference}>
                        ≈{' '}
                        {formatMoney(
                            Number(sale.reference_amount),
                            sale.reference_currency as StoreCurrency
                        )}
                    </TextMalet>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        gap: 10,
    },    rowLeft: {
        flex: 1,
        gap: 3,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
    },
    rowRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    rowTotal: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.3,
    },
    rowProfit: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16a34a',
    },
    rowReference: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.35)',
        marginTop: 1,
    },
});

export default memo(SaleRow);
