import { StyleSheet, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';

export interface BarPoint {
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarPoint[];
    /** Altura del área de barras. */
    height?: number;
    formatValue?: (value: number) => string;
}

/** Gráfico de barras simple (sin librerías) para volumen y series por día. */
export default function BarChart({ data, height = 120, formatValue }: BarChartProps) {
    const max = Math.max(1, ...data.map((point) => point.value));
    /** Con muchas barras se rotula solo una de cada N para que se lea. */
    const labelStep = Math.max(1, Math.ceil(data.length / 8));

    if (data.length === 0) {
        return (
            <TextMalet style={styles.empty}>Sin datos en este rango.</TextMalet>
        );
    }

    return (
        <View>
            <View style={[styles.chart, { height }]}>
                {data.map((point, index) => (
                    <View key={`${point.label}-${index}`} style={styles.column}>
                        <View style={styles.track}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: `${Math.max(
                                            point.value > 0 ? 5 : 2,
                                            (point.value / max) * 100
                                        )}%`,
                                        opacity: point.value > 0 ? 1 : 0.25,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.labels}>
                {data.map((point, index) => (
                    <TextMalet
                        key={`${point.label}-${index}`}
                        style={styles.label}
                        numberOfLines={1}
                    >
                        {index % labelStep === 0 || index === data.length - 1
                            ? point.label
                            : ''}
                    </TextMalet>
                ))}
            </View>

            {formatValue ? (
                <TextMalet style={styles.max}>Máx. {formatValue(max)}</TextMalet>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    column: {
        flex: 1,
        height: '100%',
    },
    track: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        backgroundColor: '#111',
        borderRadius: 6,
    },
    labels: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 6,
    },
    label: {
        flex: 1,
        fontSize: 9.5,
        color: 'rgba(0,0,0,0.45)',
        textAlign: 'center',
    },
    max: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 6,
    },
    empty: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
    },
});
