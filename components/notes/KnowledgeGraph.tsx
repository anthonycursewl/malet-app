import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
} from 'd3-force';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import TextMalet from '@/components/TextMalet/TextMalet';
import { NoteGraph, NoteGraphNode } from '@/shared/entities/Note';

interface KnowledgeGraphProps {
    graph: NoteGraph;
    viewport: { scale: number; x: number; y: number };
    viewportWidth: number;
    viewportHeight: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

type SimNode = NoteGraphNode & {
    x: number;
    y: number;
    degree: number;
};

type Position = { x: number; y: number; degree: number };

/** Lienzo virtual según cantidad de nodos: más espacio = menos solapamiento. */
export const graphLayoutSize = (count: number): number =>
    count <= 20 ? 600 : count <= 80 ? 1200 : 2400;

/** Firma de la estructura (nodos + aristas) para cachear el layout. */
export function graphStructureKey(graph: NoteGraph): string {
    let hash = 5381;
    const add = (value: string) => {
        for (let index = 0; index < value.length; index += 1) {
            hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
        }
    };

    [...graph.nodes]
        .map((node) => node.id)
        .sort()
        .forEach(add);
    [...graph.edges]
        .map((edge) => `${edge.source}>${edge.target}`)
        .sort()
        .forEach(add);

    return `${graph.nodes.length}:${graph.edges.length}:${hash >>> 0}`;
}

const LAYOUT_CACHE_MAX = 3;
const layoutCache = new Map<string, Map<string, Position>>();

const cachePositions = (key: string, positions: Map<string, Position>) => {
    if (layoutCache.size >= LAYOUT_CACHE_MAX) {
        const oldest = layoutCache.keys().next().value;
        if (oldest) layoutCache.delete(oldest);
    }
    layoutCache.set(key, positions);
};

const buildCachedLayout = (
    graph: NoteGraph,
    key: string
): SimNode[] | null => {
    const positions = layoutCache.get(key);
    if (!positions) return null;

    const nodes: SimNode[] = [];
    for (const node of graph.nodes) {
        const position = positions.get(node.id);
        if (!position) return null;
        nodes.push({ ...node, ...position });
    }
    return nodes;
};

const ZONES = 6;
const CHUNK_SIZE = 80;

const truncate = (title: string, max = 20): string => {
    const clean = title.trim() || 'Sin título';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const nodeRadius = (node: SimNode, layoutSize: number): number =>
    layoutSize / 90 +
    Math.min(layoutSize / 120, node.degree * (layoutSize / 600));

/**
 * Grafo con layout por frames (no bloquea el render), caché por estructura,
 * aristas en un solo Path y render por chunks con nivel de detalle por zoom.
 */
export default function KnowledgeGraph({
    graph,
    viewport,
    viewportWidth,
    viewportHeight,
    selectedId,
    onSelect,
}: KnowledgeGraphProps) {
    const layoutSize = graphLayoutSize(graph.nodes.length);
    const structureKey = useMemo(() => graphStructureKey(graph), [graph]);
    const [layout, setLayout] = useState<SimNode[] | null>(() =>
        buildCachedLayout(graph, structureKey)
    );

    useEffect(() => {
        if (layout) return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const degree = new Map<string, number>();
        for (const edge of graph.edges) {
            degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
            degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
        }

        const nodes: SimNode[] = graph.nodes.map((node, index) => {
            const angle =
                (index / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
            return {
                ...node,
                x:
                    layoutSize / 2 +
                    Math.cos(angle) * layoutSize * 0.06,
                y:
                    layoutSize / 2 +
                    Math.sin(angle) * layoutSize * 0.06,
                degree: degree.get(node.id) ?? 0,
            };
        });

        const links = graph.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
        }));

        const simulation = forceSimulation(nodes as any)
            .force(
                'link',
                forceLink(links as any)
                    .id((node: any) => node.id)
                    .distance(Math.max(50, layoutSize / 25))
                    .strength(0.55)
            )
            .force(
                'charge',
                forceManyBody().strength(-Math.max(80, layoutSize / 10))
            )
            .force('center', forceCenter(layoutSize / 2, layoutSize / 2))
            .force(
                'collide',
                forceCollide(
                    (node: any) =>
                        nodeRadius(node, layoutSize) + layoutSize / 200
                )
            )
            .stop();

        const maxTicks = graph.nodes.length > 100 ? 220 : 300;
        let tick = 0;

        // Ticks en lotes pequeños: la UI respira mientras se calcula.
        const step = () => {
            if (cancelled) return;

            for (
                let index = 0;
                index < 8 && tick < maxTicks;
                index += 1
            ) {
                simulation.tick();
                tick += 1;
            }

            if (tick < maxTicks) {
                timer = setTimeout(step, 0);
                return;
            }

            nodes.forEach((node) => {
                node.x = Math.max(30, Math.min(layoutSize - 30, node.x));
                node.y = Math.max(30, Math.min(layoutSize - 30, node.y));
            });

            const positions = new Map<string, Position>(
                nodes.map((node) => [
                    node.id,
                    { x: node.x, y: node.y, degree: node.degree },
                ])
            );
            cachePositions(structureKey, positions);
            setLayout(nodes.map((node) => ({ ...node })));
        };

        timer = setTimeout(step, 0);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            simulation.stop();
        };
    }, [graph, structureKey, layoutSize, layout]);

    const currentById = useMemo(
        () => new Map(graph.nodes.map((node) => [node.id, node])),
        [graph.nodes]
    );

    // Posiciones del layout + títulos/pinned actuales (por si cambian sin
    // cambiar la estructura).
    const nodes = useMemo<SimNode[]>(() => {
        if (!layout) return [];
        return layout.map((node) => {
            const current = currentById.get(node.id);
            return current
                ? {
                      ...node,
                      title: current.title,
                      pinned: current.pinned,
                      is_public: current.is_public,
                  }
                : node;
        });
    }, [layout, currentById]);

    const nodeById = useMemo(
        () => new Map(nodes.map((node) => [node.id, node])),
        [nodes]
    );

    const neighbors = useMemo(() => {
        const set = new Set<string>();
        if (!selectedId) return set;

        for (const edge of graph.edges) {
            if (edge.source === selectedId) set.add(edge.target);
            if (edge.target === selectedId) set.add(edge.source);
        }
        return set;
    }, [graph.edges, selectedId]);

    const overview = viewport.scale <= 1.15;

    /**
     * Rectángulo del layout visible en pantalla. Se invierte la transformación
     * (centro + escala + traslación) para hacer culling como un canvas.
     */
    const visibleRect = useMemo(() => {
        if (!viewportWidth || !viewportHeight) return null;

        const fit =
            Math.min(viewportWidth, viewportHeight) / layoutSize;
        const offsetX = (viewportWidth - layoutSize * fit) / 2;
        const offsetY = (viewportHeight - layoutSize * fit) / 2;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const scale = Math.max(0.0001, viewport.scale);

        const inverse = (screenX: number, screenY: number) => ({
            x:
                (centerX +
                    (screenX - viewport.x - centerX) / scale -
                    offsetX) /
                fit,
            y:
                (centerY +
                    (screenY - viewport.y - centerY) / scale -
                    offsetY) /
                fit,
        });

        const topLeft = inverse(0, 0);
        const bottomRight = inverse(viewportWidth, viewportHeight);
        const margin = layoutSize * 0.12;

        return {
            minX:
                Math.max(0, Math.min(topLeft.x, bottomRight.x) - margin),
            minY:
                Math.max(0, Math.min(topLeft.y, bottomRight.y) - margin),
            maxX:
                Math.min(
                    layoutSize,
                    Math.max(topLeft.x, bottomRight.x) + margin
                ),
            maxY:
                Math.min(
                    layoutSize,
                    Math.max(topLeft.y, bottomRight.y) + margin
                ),
        };
    }, [viewport, viewportWidth, viewportHeight, layoutSize]);

    /**
     * En vista general se muestrea el mapa (no se pueden mostrar 300 nodos
     * legibles a la vez). Al hacer zoom se hace **culling por viewport**:
     * solo se renderizan los nodos visibles, y cuanto más zoom, menos nodos
     * entran en pantalla.
     */
    const lod = useMemo(() => {
        const selectedNode = selectedId
            ? nodeById.get(selectedId)
            : undefined;
        const priorityNodes: SimNode[] = selectedNode
            ? [
                  selectedNode,
                  ...[...neighbors]
                      .map((id) => nodeById.get(id))
                      .filter((node): node is SimNode => !!node)
                      .sort((a, b) => b.degree - a.degree)
                      .slice(0, 40),
              ]
            : [];
        const priorityIds = new Set(priorityNodes.map((node) => node.id));
        const candidates = nodes.filter(
            (node) => !priorityIds.has(node.id)
        );

        let restNodes: SimNode[] = [];

        if (overview) {
            const budget = 45;
            const mandatory = candidates.filter(
                (node) => node.pinned || node.degree >= 10
            );
            const mandatoryIds = new Set(
                mandatory.map((node) => node.id)
            );

            const zoneSize = layoutSize / ZONES;
            const groups: SimNode[][] = Array.from(
                { length: ZONES * ZONES },
                () => []
            );

            for (const node of candidates) {
                if (mandatoryIds.has(node.id)) continue;
                const column = Math.min(
                    ZONES - 1,
                    Math.max(0, Math.floor(node.x / zoneSize))
                );
                const row = Math.min(
                    ZONES - 1,
                    Math.max(0, Math.floor(node.y / zoneSize))
                );
                groups[row * ZONES + column].push(node);
            }

            for (const group of groups) {
                group.sort((a, b) => b.degree - a.degree);
            }

            const picked: SimNode[] = [...mandatory];
            let round = 0;

            while (picked.length < budget) {
                let added = false;
                for (const group of groups) {
                    if (picked.length >= budget) break;
                    const node = group[round];
                    if (node) {
                        picked.push(node);
                        added = true;
                    }
                }
                if (!added) break;
                round += 1;
            }

            restNodes = picked;
        } else if (visibleRect) {
            const centerX = (visibleRect.minX + visibleRect.maxX) / 2;
            const centerY = (visibleRect.minY + visibleRect.maxY) / 2;
            const cap = 140;

            const inside = candidates.filter(
                (node) =>
                    node.x >= visibleRect.minX &&
                    node.x <= visibleRect.maxX &&
                    node.y >= visibleRect.minY &&
                    node.y <= visibleRect.maxY
            );

            if (inside.length > cap) {
                inside.sort((a, b) => {
                    const da =
                        (a.x - centerX) ** 2 + (a.y - centerY) ** 2;
                    const db =
                        (b.x - centerX) ** 2 + (b.y - centerY) ** 2;
                    return da - db;
                });
                restNodes = inside.slice(0, cap);
            } else {
                restNodes = inside;
            }
        }

        return { priorityNodes, restNodes };
    }, [
        nodes,
        nodeById,
        layoutSize,
        selectedId,
        neighbors,
        overview,
        visibleRect,
    ]);

    const [renderCount, setRenderCount] = useState(CHUNK_SIZE);

    useEffect(() => {
        if (renderCount >= lod.restNodes.length) return;

        const timer = setTimeout(() => {
            setRenderCount((current) =>
                Math.min(current + CHUNK_SIZE, lod.restNodes.length)
            );
        }, 16);

        return () => clearTimeout(timer);
    }, [renderCount, lod.restNodes.length]);

    if (!layout) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="small" color="#6b6b6b" />
                <TextMalet style={styles.loadingText}>
                    Calculando mapa…
                </TextMalet>
            </View>
        );
    }

    const visibleRest = lod.restNodes.slice(
        0,
        Math.min(renderCount, lod.restNodes.length)
    );
    const visibleNodes = [...lod.priorityNodes, ...visibleRest];
    const visibleIds = new Set(visibleNodes.map((node) => node.id));

    const edgePath = (onlySelected = false) => {
        const parts: string[] = [];
        for (const edge of graph.edges) {
            const sourceVisible = visibleIds.has(edge.source);
            const targetVisible = visibleIds.has(edge.target);
            // En vista general solo aristas entre nodos visibles; al hacer
            // zoom mostramos también las que salen del viewport.
            if (
                overview
                    ? !(sourceVisible && targetVisible)
                    : !sourceVisible && !targetVisible
            ) {
                continue;
            }
            if (
                onlySelected &&
                edge.source !== selectedId &&
                edge.target !== selectedId
            ) {
                continue;
            }

            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) continue;

            parts.push(
                `M${source.x.toFixed(1)} ${source.y.toFixed(1)}L${target.x.toFixed(1)} ${target.y.toFixed(1)}`
            );
        }
        return parts.join('');
    };

    const allEdges = edgePath();
    const selectedEdges = selectedId ? edgePath(true) : '';

    const manyNodes = nodes.length > 60;
    const edgeWidth = Math.max(1, layoutSize / 600);
    const selectedEdgeWidth = Math.max(2, layoutSize / 300);
    const labelSize = Math.max(9, layoutSize / 70);
    const strokeWidth = Math.max(1, layoutSize / 600);

    return (
        <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${layoutSize} ${layoutSize}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {allEdges.length > 0 && (
                <Path
                    d={allEdges}
                    stroke={selectedId ? '#ededed' : '#dcdcdc'}
                    strokeWidth={edgeWidth}
                    fill="none"
                    opacity={selectedId ? 0.45 : 0.8}
                />
            )}
            {selectedEdges.length > 0 && (
                <Path
                    d={selectedEdges}
                    stroke="#0b6e99"
                    strokeWidth={selectedEdgeWidth}
                    fill="none"
                />
            )}

            {visibleNodes.map((node) => {
                const radius = nodeRadius(node, layoutSize);
                const isSelected = node.id === selectedId;
                const isNeighbor = neighbors.has(node.id);
                const dimmed = !!selectedId && !isSelected && !isNeighbor;
                const showLabelsForVisible =
                    !overview && visibleNodes.length <= 60;
                const showLabel =
                    isSelected ||
                    isNeighbor ||
                    node.pinned ||
                    node.degree >= 8 ||
                    showLabelsForVisible ||
                    (!manyNodes && node.degree >= 2);

                return (
                    <G
                        key={node.id}
                        onPress={() => onSelect(node.id)}
                        opacity={dimmed ? 0.3 : 1}
                    >
                        {isSelected && (
                            <Circle
                                cx={node.x}
                                cy={node.y}
                                r={radius + layoutSize / 100}
                                fill="#e8f1f8"
                                opacity={0.85}
                            />
                        )}
                        <Circle
                            cx={node.x}
                            cy={node.y}
                            r={radius}
                            fill={
                                node.pinned
                                    ? '#fff7ed'
                                    : isSelected
                                      ? '#e8f1f8'
                                      : node.is_public
                                        ? '#eef7f1'
                                        : '#fff'
                            }
                            stroke={
                                node.pinned
                                    ? '#b45309'
                                    : isSelected
                                      ? '#0b6e99'
                                      : node.is_public
                                        ? '#2f8f5b'
                                        : '#6b6b6b'
                            }
                            strokeWidth={strokeWidth * 1.2}
                        />
                        {showLabel && (
                            <SvgText
                                x={node.x}
                                y={node.y + radius + labelSize}
                                fontSize={labelSize}
                                fontWeight={isSelected ? '700' : '400'}
                                textAnchor="middle"
                                fill={isSelected ? '#0b6e99' : '#37352f'}
                            >
                                {truncate(node.title)}
                            </SvgText>
                        )}
                    </G>
                );
            })}
        </Svg>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#8a8a8a',
    },
});
