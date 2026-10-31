import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
    Circle,
    G,
    Line,
    Text as SvgText,
} from 'react-native-svg';

export type LocalGraphKind = 'out' | 'in';

export interface LocalGraphNode {
    id: string;
    title: string;
    kind: LocalGraphKind;
}

interface LocalGraphProps {
    nodes: LocalGraphNode[];
    onOpen: (id: string) => void;
}

const truncate = (title: string, max = 16): string => {
    const clean = title.trim() || 'Sin título';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

/** Vista local de 1 salto: nota actual + enlaces salientes y backlinks. */
export default function LocalGraph({ nodes, onOpen }: LocalGraphProps) {
    const visible = useMemo(() => nodes.slice(0, 8), [nodes]);

    const placed = useMemo(
        () =>
            visible.map((node, index) => {
                const angle =
                    -Math.PI / 2 +
                    (index * 2 * Math.PI) / Math.max(visible.length, 1);
                return {
                    ...node,
                    x: 160 + Math.cos(angle) * 112,
                    y: 100 + Math.sin(angle) * 68,
                };
            }),
        [visible],
    );

    return (
        <View style={styles.wrap}>
            <Svg width="100%" height={225} viewBox="0 0 320 225">
                {placed.map((node) => (
                    <Line
                        key={`line-${node.id}`}
                        x1={160}
                        y1={100}
                        x2={node.x}
                        y2={node.y}
                        stroke="#e3e3e1"
                        strokeWidth={1}
                    />
                ))}

                <Circle cx={160} cy={100} r={20} fill="#111" />
                <SvgText
                    x={160}
                    y={103.5}
                    fill="#fff"
                    fontSize={8}
                    fontWeight="700"
                    textAnchor="middle"
                >
                    Nota
                </SvgText>

                {placed.map((node) => {
                    const color = node.kind === 'out' ? '#0b6e99' : '#8250df';
                    const fill = node.kind === 'out' ? '#e8f1f8' : '#f1eafb';
                    return (
                        <G key={node.id} onPress={() => onOpen(node.id)}>
                            <Circle
                                cx={node.x}
                                cy={node.y}
                                r={14}
                                fill={fill}
                                stroke={color}
                                strokeWidth={1.2}
                            />
                            <SvgText
                                x={node.x}
                                y={node.y + 3}
                                fill={color}
                                fontSize={8}
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {node.title.trim().charAt(0).toUpperCase() || '?'}
                            </SvgText>
                            <SvgText
                                x={node.x}
                                y={node.y + 26}
                                fill="#6b6b6b"
                                fontSize={7}
                                textAnchor="middle"
                            >
                                {truncate(node.title)}
                            </SvgText>
                        </G>
                    );
                })}

                {nodes.length > 8 && (
                    <SvgText
                        x={160}
                        y={214}
                        fill="#9a9a9a"
                        fontSize={8}
                        textAnchor="middle"
                    >
                        +{nodes.length - 8} más
                    </SvgText>
                )}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        borderWidth: 1,
        borderColor: '#ececeb',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingVertical: 4,
    },
});
