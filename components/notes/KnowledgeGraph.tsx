import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
} from 'd3-force';
import { useEffect, useMemo, useState } from 'react';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { NoteGraph, NoteGraphNode } from '@/shared/entities/Note';

interface KnowledgeGraphProps {
    graph: NoteGraph;
    zoomLevel: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

type SimNode = NoteGraphNode & {
    x: number;
    y: number;
    degree: number;
};

type SimLink = { source: SimNode | string; target: SimNode | string };

/** Lienzo virtual según cantidad de nodos: más espacio = menos solapamiento. */
export const graphLayoutSize = (count: number): number =>
    count <= 20 ? 600 : count <= 80 ? 1200 : 2400;

const ZONES = 6;
const CHUNK_SIZE = 60;

const truncate = (title: string, max = 20): string => {
    const clean = title.trim() || 'Sin título';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const nodeRadius = (node: SimNode, layoutSize: number): number =>
    layoutSize / 90 +
    Math.min(layoutSize / 120, node.degree * (layoutSize / 600));

const linkIds = (link: SimLink): [string, string] => {
    const source =
        typeof link.source === 'string' ? link.source : link.source.id;
    const target =
        typeof link.target === 'string' ? link.target : link.target.id;
    return [source, target];
};

/**
 * Grafo con layout de fuerzas y render procedural:
 * - nivel de detalle según zoom,
 * - muestreo por zonas para cubrir todo el mapa,
 * - nodos por chunks (no bloquea el frame),
 * - selección + vecinos siempre visibles.
 */
export default function KnowledgeGraph({
    graph,
    zoomLevel,
    selectedId,
    onSelect,
}: KnowledgeGraphProps) {
    const layoutSize = graphLayoutSize(graph.nodes.length);

    const layout = useMemo(() => {
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

        const links: SimLink[] = graph.edges.map((edge) => ({
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

        // Menos ticks en grafos grandes para no bloquear la apertura.
        const ticks = graph.nodes.length > 100 ? 260 : 300;
        for (let index = 0; index < ticks; index += 1) {
            simulation.tick();
        }

        nodes.forEach((node) => {
            node.x = Math.max(30, Math.min(layoutSize - 30, node.x));
            node.y = Math.max(30, Math.min(layoutSize - 30, node.y));
        });

        return { nodes, links };
    }, [graph, layoutSize]);

    const nodeById = useMemo(
        () => new Map(layout.nodes.map((node) => [node.id, node])),
        [layout.nodes]
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

    /**
     * Nivel de detalle: a más zoom, más nodos. Los nodos se eligen por zonas
     * (para que no se concentren en un solo cluster) y los hubs van primero.
     */
    const lod = useMemo(() => {
        // Vecinos directos del nodo seleccionado (máximo 40 para no reventar
        // el render cuando el nodo es un hub con cientos de conexiones).
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

        const rest = layout.nodes.filter(
            (node) => !priorityIds.has(node.id)
        );

        const budget =
            zoomLevel < 1.4 ? 90 : zoomLevel < 2.2 ? 180 : 520;

        const mandatory = rest.filter(
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

        for (const node of rest) {
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

        return { priorityNodes, restNodes: picked, budget };
    }, [
        layout.nodes,
        layoutSize,
        zoomLevel,
        selectedId,
        neighbors,
        nodeById,
    ]);

    const [renderCount, setRenderCount] = useState(CHUNK_SIZE);

    // Carga progresiva: agrega un chunk cada frame hasta completar el LOD.
    useEffect(() => {
        if (renderCount >= lod.restNodes.length) return;

        const timer = setTimeout(() => {
            setRenderCount((current) =>
                Math.min(current + CHUNK_SIZE, lod.restNodes.length)
            );
        }, 16);

        return () => clearTimeout(timer);
    }, [renderCount, lod.restNodes.length]);

    const visibleRest = lod.restNodes.slice(
        0,
        Math.min(renderCount, lod.restNodes.length)
    );
    const visibleNodes = [...lod.priorityNodes, ...visibleRest];
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const visibleLinks = layout.links.filter((link) => {
        const [source, target] = linkIds(link);
        return visibleIds.has(source) && visibleIds.has(target);
    });

    const manyNodes = layout.nodes.length > 60;
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
            {visibleLinks.map((link, index) => {
                const [sourceId, targetId] = linkIds(link);
                const source = nodeById.get(sourceId);
                const target = nodeById.get(targetId);
                if (!source || !target) return null;

                const connected =
                    !!selectedId &&
                    (sourceId === selectedId || targetId === selectedId);

                return (
                    <Line
                        key={`edge-${index}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={
                            selectedId
                                ? connected
                                    ? '#0b6e99'
                                    : '#ededed'
                                : '#dcdcdc'
                        }
                        strokeWidth={
                            connected ? selectedEdgeWidth : edgeWidth
                        }
                        opacity={selectedId && !connected ? 0.25 : 0.8}
                    />
                );
            })}

            {visibleNodes.map((node) => {
                const radius = nodeRadius(node, layoutSize);
                const isSelected = node.id === selectedId;
                const isNeighbor = neighbors.has(node.id);
                const dimmed = !!selectedId && !isSelected && !isNeighbor;
                const showLabel =
                    isSelected ||
                    isNeighbor ||
                    node.pinned ||
                    node.degree >= 6 ||
                    (!manyNodes && node.degree >= 2) ||
                    (zoomLevel >= 2 && node.degree >= 3);

                return (
                    <G
                        key={node.id}
                        onPress={() => onSelect(node.id)}
                        opacity={dimmed ? 0.25 : 1}
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
                                      : '#fff'
                            }
                            stroke={
                                node.pinned
                                    ? '#b45309'
                                    : isSelected
                                      ? '#0b6e99'
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
