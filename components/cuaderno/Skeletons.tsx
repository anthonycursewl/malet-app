import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Animated,
    DimensionValue,
    Dimensions,
    Easing,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

/**
 * Skeletons de carga del módulo Malet Sales.
 *
 * Optimización: cada skeleton usa **un único** `Animated.Value` que mueve una
 * banda de brillo (transform → driver nativo) sobre todos sus bloques. La banda
 * es translúcida: sobre el fondo blanco no se ve y sobre los bloques grises sí,
 * así que el shimmer no necesita `MaskedView` ni un gradiente por cajita.
 */

const SKELETON_COLOR = '#e9e9ec';

/** Duración de un barrido de brillo. */
const SHIMMER_MS = 1500;
/** Ancho de la banda de brillo. */
const SHIMMER_BAND = 180;
/** Ancho de referencia antes de medir el contenedor real. */
const FALLBACK_WIDTH = Dimensions.get('window').width;

/** Anchos aproximados de las pestañas del panel (Ventas, Recibos, ...). */
const TAB_WIDTHS = [68, 74, 88, 132, 76, 82, 72];

interface SkeletonShimmerProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/**
 * Contenedor de skeleton con brillo: mantiene el layout de los hijos y barre una
 * banda de luz por encima. También recorta lo que se salga del contenedor.
 */
export function SkeletonShimmer({ children, style }: SkeletonShimmerProps) {
    const [progress] = useState(() => new Animated.Value(0));
    const [width, setWidth] = useState(FALLBACK_WIDTH);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: SHIMMER_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [progress]);

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-SHIMMER_BAND, width + SHIMMER_BAND],
    });

    return (
        <View
            style={[style, styles.shimmerWrap]}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
            {children}
            <Animated.View
                pointerEvents="none"
                style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}
            >
                <LinearGradient
                    colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.85)',
                        'rgba(255,255,255,0)',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerBand}
                />
            </Animated.View>
        </View>
    );
}

interface SkeletonBlockProps {
    w?: DimensionValue;
    h: number;
    r?: number;
    style?: StyleProp<ViewStyle>;
}

/** Cajita base (sin animación propia: hereda el brillo del contenedor). */
export function SkeletonBlock({ w = '100%', h, r = 8, style }: SkeletonBlockProps) {
    return <View style={[styles.block, { width: w, height: h, borderRadius: r }, style]} />;
}

/** Grilla de 6 tarjetas del resumen (misma geometría que SummaryCards). */
export function SummaryCardsSkeleton() {
    return (
        <SkeletonShimmer style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.summaryCard}>
                    <SkeletonBlock w={56} h={10} r={5} />
                    <SkeletonBlock w={80} h={15} r={6} style={styles.summaryValue} />
                </View>
            ))}
        </SkeletonShimmer>
    );
}

const CHART_BARS = [46, 78, 60, 104, 70, 92, 58];

/** Gráfica de barras (misma altura que SeriesChartCard). */
export function ChartSkeleton() {
    return (
        <SkeletonShimmer style={styles.chartCard}>
            <View style={styles.chartBars}>
                {CHART_BARS.map((h, i) => (
                    <SkeletonBlock key={i} w={24} h={h} r={6} />
                ))}
            </View>
        </SkeletonShimmer>
    );
}

/** Filas de lista: textos + bloque a la derecha (ventas y productos). */
export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <SkeletonShimmer style={styles.list}>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={styles.row}>
                    <View style={styles.rowTexts}>
                        <SkeletonBlock w={140} h={12} r={6} />
                        <SkeletonBlock w={92} h={10} r={5} style={styles.line2} />
                    </View>
                    <SkeletonBlock w={68} h={14} r={6} />
                </View>
            ))}
        </SkeletonShimmer>
    );
}

/** Filas de métodos de cobro (con placeholder del switch). */
export function PaymentMethodsSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <SkeletonShimmer style={styles.list}>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={styles.row}>
                    <View style={styles.rowTexts}>
                        <SkeletonBlock w={120} h={12} r={6} />
                        <SkeletonBlock w={86} h={10} r={5} style={styles.line2} />
                    </View>
                    <SkeletonBlock w={44} h={26} r={13} />
                </View>
            ))}
        </SkeletonShimmer>
    );
}

/** Filas de miembros (con avatar circular y badge del dueño). */
export function MembersSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <SkeletonShimmer style={styles.list}>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={styles.row}>
                    <SkeletonBlock w={36} h={36} r={18} />
                    <View style={styles.rowTexts}>
                        <SkeletonBlock w={130} h={12} r={6} />
                        <SkeletonBlock w={74} h={10} r={5} style={styles.line2} />
                    </View>
                    {i === 0 && <SkeletonBlock w={54} h={18} r={9} />}
                </View>
            ))}
        </SkeletonShimmer>
    );
}

/** Filas de tiendas (avatar cuadrado + chevron). */
export function StoresSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <SkeletonShimmer style={styles.list}>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={styles.storeRow}>
                    <SkeletonBlock w={40} h={40} r={12} />
                    <View style={styles.rowTexts}>
                        <SkeletonBlock w={150} h={13} r={6} />
                        <SkeletonBlock w={96} h={10} r={5} style={styles.line2} />
                    </View>
                    <SkeletonBlock w={12} h={18} r={4} />
                </View>
            ))}
        </SkeletonShimmer>
    );
}

/** Tarjeta de foto y banner de la tienda (preview + textos + acciones). */
export function StorePhotosSkeleton() {
    return (
        <SkeletonShimmer>
            <View style={styles.photosCard}>
                <SkeletonBlock h={150} r={16} />
                <SkeletonBlock w={64} h={64} r={32} style={styles.photosAvatar} />
                <View style={styles.photosTexts}>
                    <SkeletonBlock w={110} h={13} r={6} />
                    <SkeletonBlock w={230} h={10} r={5} style={styles.line2} />
                    <SkeletonBlock w={186} h={10} r={5} style={styles.line2} />
                </View>
                <View style={styles.photosActions}>
                    <SkeletonBlock w={112} h={34} r={17} />
                    <SkeletonBlock w={128} h={34} r={17} />
                </View>
            </View>
        </SkeletonShimmer>
    );
}

/** Tarjetas de ajustes de la tienda. */
export function SettingsSkeleton() {
    return (
        <View style={styles.list}>
            <StorePhotosSkeleton />

            <SkeletonShimmer style={styles.list}>
                <SkeletonBlock h={64} r={16} />
                <SkeletonBlock h={104} r={16} />
                <SkeletonBlock w={110} h={12} r={6} style={styles.sectionGap} />
                <SkeletonBlock h={124} r={16} />
            </SkeletonShimmer>
        </View>
    );
}

/** Botón "Nueva venta" + chips de rango + selectores (igual que SalesSection). */
export function SalesHeaderSkeleton() {
    return (
        <SkeletonShimmer style={styles.salesHeader}>
            <SkeletonBlock w={130} h={40} r={20} />

            <View style={styles.filters}>
                <View style={styles.chips}>
                    {[44, 48, 48, 58, 50, 110].map((w, i) => (
                        <SkeletonBlock key={i} w={w} h={28} r={15} />
                    ))}
                </View>

                <View style={styles.selectorsRow}>
                    <SkeletonBlock h={46} r={14} style={styles.flex1} />
                    <SkeletonBlock h={46} r={14} style={styles.flex1} />
                </View>
            </View>
        </SkeletonShimmer>
    );
}

/**
 * Panel de tienda durante la carga: pestañas + contenido de "Ventas".
 * La cabecera NO se dibuja aquí porque la pantalla ya renderiza la real
 * (con su botón de volver), así no se duplica.
 */
export function StorePanelSkeleton() {
    return (
        <View style={styles.panel}>
            <SkeletonShimmer style={styles.tabs}>
                {TAB_WIDTHS.map((w, i) => (
                    <SkeletonBlock key={i} w={w} h={28} r={15} />
                ))}
            </SkeletonShimmer>

            <View style={styles.panelDivider} />

            <View style={styles.panelBody}>
                <SalesHeaderSkeleton />
                <SummaryCardsSkeleton />
                <ChartSkeleton />
                <SkeletonBlock w={60} h={12} r={6} />
                <ListRowsSkeleton rows={3} />
            </View>
        </View>
    );
}

/** Formulario de venta (campos + tarjeta de totales). */
export function SaleFormSkeleton() {
    return (
        <SkeletonShimmer style={styles.form}>
            <SkeletonBlock w={90} h={12} r={6} />
            <SkeletonBlock h={46} r={12} />
            <SkeletonBlock w={120} h={12} r={6} style={styles.sectionGap} />
            <View style={styles.chips}>
                {[86, 74, 64].map((w, i) => (
                    <SkeletonBlock key={i} w={w} h={28} r={14} />
                ))}
            </View>
            <View style={styles.formRow}>
                <SkeletonBlock h={46} r={12} style={styles.flex1} />
                <SkeletonBlock h={46} r={12} style={styles.flex1} />
            </View>
            <SkeletonBlock h={92} r={16} style={styles.sectionGap} />
        </SkeletonShimmer>
    );
}

/** Documento del recibo: cabecera, facturar a, tabla de líneas y totales. */
export function ReceiptDocSkeleton() {
    return (
        <SkeletonShimmer style={styles.receiptDoc}>
            <View style={styles.receiptDocHeader}>
                <View style={styles.receiptDocHeaderTexts}>
                    <SkeletonBlock w={92} h={20} r={6} />
                    <SkeletonBlock w={150} h={11} r={5} style={styles.line2} />
                    <SkeletonBlock w={130} h={11} r={5} style={styles.line2} />
                </View>
                <SkeletonBlock w={38} h={39} r={8} />
            </View>

            <SkeletonBlock w={120} h={12} r={6} />
            <SkeletonBlock h={30} r={8} />

            <SkeletonBlock h={20} r={6} style={styles.sectionGap} />

            <View style={styles.receiptDocTable}>
                <SkeletonBlock w={110} h={10} r={5} />
                <SkeletonBlock h={14} r={6} />
                <SkeletonBlock h={14} r={6} />
            </View>

            <View style={styles.receiptDocTotals}>
                <SkeletonBlock w={70} h={11} r={5} />
                <SkeletonBlock w={90} h={13} r={6} />
                <SkeletonBlock w={70} h={11} r={5} />
                <SkeletonBlock w={90} h={13} r={6} />
            </View>
        </SkeletonShimmer>
    );
}

/**
 * Detalle de venta: réplica del **ticket** actual (cabecera centrada, tabla de
 * líneas, totales a la derecha, QR y acciones fijas abajo).
 */
export function SaleDetailSkeleton() {
    return (
        <View style={styles.ticketRoot}>
            <SkeletonShimmer style={styles.ticketStack}>
                {/* Papel del ticket */}
                <View style={styles.ticketCard}>
                    {/* Cabecera centrada */}
                    <View style={styles.ticketCenter}>
                        <SkeletonBlock w={152} h={16} r={6} />
                        <SkeletonBlock w={124} h={9} r={4} style={styles.ticketMt6} />
                        <SkeletonBlock w={92} h={11} r={5} style={styles.ticketMt8} />
                        <SkeletonBlock w={80} h={10} r={5} style={styles.ticketMt4} />
                    </View>

                    <View style={styles.ticketDashed} />

                    {/* Encabezado de la tabla */}
                    <View style={styles.ticketRow}>
                        <SkeletonBlock w={22} h={9} r={4} />
                        <SkeletonBlock w={64} h={9} r={4} />
                        <View style={styles.ticketFlex} />
                        <SkeletonBlock w={44} h={9} r={4} />
                    </View>

                    {/* Líneas con su precio unitario */}
                    {[0, 1].map((index) => (
                        <View key={index} style={styles.ticketLine}>
                            <View style={styles.ticketRow}>
                                <SkeletonBlock w={12} h={12} r={4} />
                                <SkeletonBlock w={112} h={12} r={5} />
                                <View style={styles.ticketFlex} />
                                <SkeletonBlock w={62} h={12} r={5} />
                            </View>
                            <SkeletonBlock w={74} h={9} r={4} style={styles.ticketUnit} />
                        </View>
                    ))}

                    <View style={styles.ticketDashed} />

                    {/* Contadores */}
                    <View style={styles.ticketCounters}>
                        <SkeletonBlock w={72} h={9} r={4} />
                        <SkeletonBlock w={78} h={9} r={4} />
                    </View>

                    {/* Totales alineados a la derecha */}
                    <View style={styles.ticketTotals}>
                        <View style={styles.ticketRow}>
                            <SkeletonBlock w={62} h={10} r={4} />
                            <View style={styles.ticketFlex} />
                            <SkeletonBlock w={76} h={11} r={5} />
                        </View>
                        <SkeletonBlock h={1} r={0} style={styles.ticketRule} />
                        <View style={styles.ticketRow}>
                            <SkeletonBlock w={44} h={11} r={5} />
                            <View style={styles.ticketFlex} />
                            <SkeletonBlock w={94} h={15} r={6} />
                        </View>
                        <View style={styles.ticketRow}>
                            <SkeletonBlock w={66} h={10} r={4} />
                            <View style={styles.ticketFlex} />
                            <SkeletonBlock w={76} h={11} r={5} />
                        </View>
                    </View>

                    <View style={styles.ticketDashed} />

                    {/* Datos (cliente / método) */}
                    <View style={styles.ticketRow}>
                        <SkeletonBlock w={56} h={10} r={4} />
                        <View style={styles.ticketFlex} />
                        <SkeletonBlock w={98} h={11} r={5} />
                    </View>
                    <View style={styles.ticketRow}>
                        <SkeletonBlock w={104} h={10} r={4} />
                        <View style={styles.ticketFlex} />
                        <SkeletonBlock w={78} h={11} r={5} />
                    </View>

                    <View style={styles.ticketDashed} />

                    {/* QR + pie */}
                    <View style={styles.ticketQrWrap}>
                        <SkeletonBlock w={126} h={126} r={8} />
                    </View>
                    <SkeletonBlock w={112} h={10} r={5} style={styles.ticketSelfCenter} />
                    <SkeletonBlock w={190} h={10} r={5} style={styles.ticketSelfCenter} />
                </View>

                {/* Nota */}
                <SkeletonBlock w="84%" h={10} r={5} style={styles.ticketSelfCenter} />
                <SkeletonBlock w="60%" h={10} r={5} style={styles.ticketSelfCenter} />
            </SkeletonShimmer>

            {/* Acciones fijas abajo */}
            <View style={styles.ticketFooter}>
                <SkeletonBlock h={40} r={20} />
                <SkeletonBlock h={40} r={20} />
            </View>
        </View>
    );
}

/** QR de invitación (cuadrado + badge de vigencia). */export function QrSkeleton() {
    return (
        <SkeletonShimmer style={styles.qrWrap}>
            <SkeletonBlock w={230} h={230} r={16} />
            <SkeletonBlock w={168} h={22} r={11} />
        </SkeletonShimmer>
    );
}

/** Pantalla de consentimiento de invitación. */
export function ConsentSkeleton() {
    return (
        <SkeletonShimmer style={styles.consent}>
            <SkeletonBlock w={84} h={84} r={42} />
            <SkeletonBlock w={200} h={14} r={7} style={styles.sectionGap} />
            <SkeletonBlock w={150} h={22} r={8} />
            <SkeletonBlock w={110} h={24} r={12} />
            <SkeletonBlock h={48} r={12} style={styles.consentButton} />
            <SkeletonBlock h={48} r={12} />
        </SkeletonShimmer>
    );
}

const styles = StyleSheet.create({
    block: {
        backgroundColor: SKELETON_COLOR,
    },
    shimmerWrap: {
        // Recorta la banda de brillo dentro del contenedor.
        overflow: 'hidden',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: SHIMMER_BAND,
    },
    shimmerBand: {
        flex: 1,
    },
    flex1: {
        flex: 1,
    },
    list: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    storeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    rowTexts: {
        flex: 1,
        gap: 0,
    },
    line2: {
        marginTop: 7,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    summaryCard: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    summaryValue: {
        marginTop: 9,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 12,
        overflow: 'hidden',
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        height: 168,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
    },
    sectionGap: {
        marginTop: 8,
    },
    photosCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
    },
    photosAvatar: {
        marginTop: -32,
        marginLeft: 14,
    },
    photosTexts: {
        marginTop: 16,
    },
    photosActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    panel: {
        flex: 1,
    },
    /** Pestañas del panel: misma fila, gap, radio y aire que las reales. */
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 10,
        paddingRight: 12,
        // Los chips que no caben se recortan (en la interfaz real se desplazan).
        overflow: 'hidden',
    },
    panelDivider: {
        height: 1,
        marginHorizontal: -18,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    /** Cabecera de "Ventas": botón + barra de filtros, con su gap real. */
    salesHeader: {
        gap: 16,
        paddingBottom: 4,
    },
    /** Barra de filtros (chips + selectores) con el gap real de SalesFiltersBar. */
    filters: {
        gap: 10,
    },
    selectorsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    panelBody: {
        gap: 16,
        paddingTop: 14,
    },
    form: {
        gap: 12,
        padding: 5,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    qrWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 26,
    },
    ticketRoot: {
        flex: 1,
    },
    ticketStack: {
        gap: 14,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 18,
        gap: 8,
    },
    ticketCenter: {
        alignItems: 'center',
    },
    ticketMt4: {
        marginTop: 4,
    },
    ticketMt6: {
        marginTop: 6,
    },
    ticketMt8: {
        marginTop: 8,
    },
    ticketDashed: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.18)',
        borderStyle: 'dashed',
        marginVertical: 8,
    },
    ticketRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ticketFlex: {
        flex: 1,
    },
    ticketLine: {
        marginTop: 6,
        gap: 4,
    },
    ticketUnit: {
        marginLeft: 20,
    },
    ticketCounters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ticketTotals: {
        alignSelf: 'flex-end',
        width: '70%',
        gap: 4,
        marginTop: 4,
    },
    ticketRule: {
        marginVertical: 3,
    },
    ticketQrWrap: {
        alignItems: 'center',
        marginTop: 8,
    },
    ticketSelfCenter: {
        alignSelf: 'center',
        marginTop: 6,
    },
    ticketFooter: {
        paddingHorizontal: 8,
        paddingTop: 10,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        gap: 10,
        marginTop: 14,
    },
    receiptDoc: {
        gap: 12,
        paddingBottom: 8,
    },
    receiptDocHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    receiptDocHeaderTexts: {
        flex: 1,
    },
    receiptDocTable: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    receiptDocTotals: {
        marginLeft: '38%',
        gap: 8,
        alignItems: 'flex-end',
    },
    consent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 24,
    },
    consentButton: {
        marginTop: 22,
        alignSelf: 'stretch',
    },
});
