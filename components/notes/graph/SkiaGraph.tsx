import {
    Canvas,
    Circle,
    Group,
    Path,
    Text,
    useFont,
} from '@shopify/react-native-skia';
import type { SkFont } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { NoteGraphEdge } from '@/shared/entities/Note';
import { nodeScreenRadius, truncateLabel } from './graphMath';
import type { LayoutNode } from './useGraphLayout';

export interface ScreenNode extends LayoutNode {
    baseX: number;
    baseY: number;
}

interface SkiaGraphProps {
    nodes: ScreenNode[];
    edges: NoteGraphEdge[];
    width: number;
    height: number;
    scale: SharedValue<number>;
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
    viewport: { scale: number; x: number; y: number };
    selectedId: string | null;
}

const LABEL_COLOR = '#37352f';
const SELECTED_COLOR = '#0b6e99';
const PUBLIC_COLOR = '#2f8f5b';
const PINNED_COLOR = '#b45309';

function SkiaHalo({
    node,
    scale,
}: {
    node: ScreenNode;
    scale: SharedValue<number>;
}) {
    const radius = useDerivedValue(
        () =>
            (nodeScreenRadius(node.degree, scale.value, true) + 5) /
            scale.value
    );
    return (
        <Circle
            cx={node.baseX}
            cy={node.baseY}
            r={radius}
            color="#e8f1f8"
        />
    );
}

function SkiaNode({
    node,
    scale,
    selected,
    neighbor,
    dimmed,
    strokeWidth,
}: {
    node: ScreenNode;
    scale: SharedValue<number>;
    selected: boolean;
    neighbor: boolean;
    dimmed: boolean;
    strokeWidth: SharedValue<number>;
}) {
    const radius = useDerivedValue(
        () => nodeScreenRadius(node.degree, scale.value, selected) / scale.value
    );

    const fill = node.pinned
        ? '#fff7ed'
        : selected
          ? '#e8f1f8'
          : node.is_public
            ? '#eef7f1'
            : '#fff';
    const stroke = node.pinned
        ? PINNED_COLOR
        : selected
          ? SELECTED_COLOR
          : node.is_public
            ? PUBLIC_COLOR
            : '#6b6b6b';

    return (
        <Group opacity={dimmed ? 0.3 : 1}>
            {selected && <SkiaHalo node={node} scale={scale} />}
            <Circle
                cx={node.baseX}
                cy={node.baseY}
                r={radius}
                color={fill}
            />
            <Circle
                cx={node.baseX}
                cy={node.baseY}
                r={radius}
                color={stroke}
                style="stroke"
                strokeWidth={strokeWidth}
            />
            {neighbor && !selected && (
                <Circle
                    cx={node.baseX}
                    cy={node.baseY}
                    r={radius}
                    color={SELECTED_COLOR}
                    style="stroke"
                    strokeWidth={strokeWidth}
                />
            )}
        </Group>
    );
}

function SkiaLabel({
    node,
    font,
    scale,
    translateX,
    translateY,
    width,
    height,
    selected,
}: {
    node: ScreenNode;
    font: SkFont;
    scale: SharedValue<number>;
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
    width: number;
    height: number;
    selected: boolean;
}) {
    const x = useDerivedValue(
        () =>
            width / 2 +
            (node.baseX - width / 2) * scale.value +
            translateX.value
    );
    const y = useDerivedValue(
        () =>
            height / 2 +
            (node.baseY - height / 2) * scale.value +
            translateY.value +
            nodeScreenRadius(node.degree, scale.value) +
            12
    );

    return (
        <Text
            x={x}
            y={y}
            text={truncateLabel(node.title)}
            font={font}
            color={selected ? SELECTED_COLOR : LABEL_COLOR}
        />
    );
}

/**
 * Renderer GPU del grafo. Las posiciones viven en el layout; el tamaño de
 * nodos, etiquetas y aristas se compensa por la cámara para no crecer con el
 * zoom. Las etiquetas se filtran por LOD y colisión en espacio de pantalla.
 */
export default function SkiaGraph({
    nodes,
    edges,
    width,
    height,
    scale,
    translateX,
    translateY,
    viewport,
    selectedId,
}: SkiaGraphProps) {
    const font = useFont(
        require('../../../assets/fonts/Onest.ttf'),
        11
    );

    const nodeById = useMemo(
        () => new Map(nodes.map((node) => [node.id, node])),
        [nodes]
    );

    const neighborIds = useMemo(() => {
        const set = new Set<string>();
        if (!selectedId) return set;
        for (const edge of edges) {
            if (edge.source === selectedId) set.add(edge.target);
            if (edge.target === selectedId) set.add(edge.source);
        }
        return set;
    }, [edges, selectedId]);

    const edgePath = useMemo(() => {
        const parts: string[] = [];
        for (const edge of edges) {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) continue;
            parts.push(
                `M${source.baseX.toFixed(1)} ${source.baseY.toFixed(1)}L${target.baseX.toFixed(1)} ${target.baseY.toFixed(1)}`
            );
        }
        return parts.join('');
    }, [edges, nodeById]);

    const selectedEdgePath = useMemo(() => {
        if (!selectedId) return '';
        const parts: string[] = [];
        for (const edge of edges) {
            if (edge.source !== selectedId && edge.target !== selectedId) {
                continue;
            }
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) continue;
            parts.push(
                `M${source.baseX.toFixed(1)} ${source.baseY.toFixed(1)}L${target.baseX.toFixed(1)} ${target.baseY.toFixed(1)}`
            );
        }
        return parts.join('');
    }, [edges, nodeById, selectedId]);

    const edgeWidth = useDerivedValue(
        () => 1 / Math.max(scale.value, 0.001)
    );
    const selectedEdgeWidth = useDerivedValue(
        () => 2 / Math.max(scale.value, 0.001)
    );
    const nodeStrokeWidth = useDerivedValue(
        () => 1.2 / Math.max(scale.value, 0.001)
    );
    const selectedNodeStrokeWidth = useDerivedValue(
        () => 2 / Math.max(scale.value, 0.001)
    );

    const labels = useMemo(() => {
        const threshold =
            viewport.scale >= 2.2
                ? 0
                : viewport.scale >= 1.6
                  ? 2
                  : viewport.scale >= 1.25
                    ? 5
                    : 12;
        const maxLabels =
            viewport.scale < 1.25
                ? 24
                : viewport.scale < 1.6
                  ? 40
                  : 55;

        const candidates = nodes
            .filter(
                (node) =>
                    node.id === selectedId ||
                    neighborIds.has(node.id) ||
                    node.pinned ||
                    node.degree >= threshold
            )
            .sort((a, b) => {
                const priority = (node: ScreenNode) =>
                    node.id === selectedId
                        ? 3
                        : neighborIds.has(node.id)
                          ? 2
                          : node.pinned
                            ? 1
                            : 0;
                return (
                    priority(b) - priority(a) || b.degree - a.degree
                );
            });

        const accepted: ScreenNode[] = [];
        const rects: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        }[] = [];
        const centerX = width / 2;
        const centerY = height / 2;

        for (const node of candidates) {
            const screenX =
                centerX +
                (node.baseX - centerX) * viewport.scale +
                viewport.x;
            const screenY =
                centerY +
                (node.baseY - centerY) * viewport.scale +
                viewport.y;
            const radius = nodeScreenRadius(node.degree, viewport.scale);
            const labelY = screenY + radius + 12;
            const halfWidth = Math.min(
                75,
                Math.max(24, truncateLabel(node.title).length * 3.1)
            );
            const rect = {
                left: screenX - halfWidth,
                right: screenX + halfWidth,
                top: labelY - 11,
                bottom: labelY + 3,
            };

            if (
                rect.right < 0 ||
                rect.left > width ||
                rect.bottom < 0 ||
                rect.top > height
            ) {
                continue;
            }

            const overlaps = rects.some(
                (other) =>
                    rect.left < other.right &&
                    rect.right > other.left &&
                    rect.top < other.bottom &&
                    rect.bottom > other.top
            );
            if (overlaps) continue;

            accepted.push(node);
            rects.push(rect);
            if (accepted.length >= maxLabels) break;
        }

        return accepted;
    }, [
        nodes,
        selectedId,
        neighborIds,
        viewport,
        width,
        height,
    ]);

    const cameraTransform = useDerivedValue(() => [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
    ]);

    const center = { x: width / 2, y: height / 2 };

    return (
        <Canvas
            style={StyleSheet.absoluteFill}
            opaque={false}
            pointerEvents="none"
        >
            <Group origin={center} transform={cameraTransform}>
                <Path
                    path={edgePath}
                    style="stroke"
                    strokeWidth={edgeWidth}
                    color={selectedId ? '#ededed' : '#dcdcdc'}
                />
                {selectedEdgePath.length > 0 && (
                    <Path
                        path={selectedEdgePath}
                        style="stroke"
                        strokeWidth={selectedEdgeWidth}
                        color={SELECTED_COLOR}
                    />
                )}
                {nodes.map((node) => {
                    const selected = node.id === selectedId;
                    const neighbor = neighborIds.has(node.id);
                    return (
                        <SkiaNode
                            key={node.id}
                            node={node}
                            scale={scale}
                            selected={selected}
                            neighbor={neighbor}
                            dimmed={!!selectedId && !selected && !neighbor}
                            strokeWidth={
                                selected
                                    ? selectedNodeStrokeWidth
                                    : nodeStrokeWidth
                            }
                        />
                    );
                })}
            </Group>

            {font &&
                labels.map((node) => (
                    <SkiaLabel
                        key={`label-${node.id}`}
                        node={node}
                        font={font}
                        scale={scale}
                        translateX={translateX}
                        translateY={translateY}
                        width={width}
                        height={height}
                        selected={node.id === selectedId}
                    />
                ))}
        </Canvas>
    );
}
