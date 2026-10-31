import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
} from 'd3-force';
import { useMemo } from 'react';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { NoteGraph, NoteGraphNode } from '@/shared/entities/Note';

interface KnowledgeGraphProps {
    graph: NoteGraph;
    width: number;
    height: number;
    onOpen: (id: string) => void;
}

type SimNode = NoteGraphNode & {
    x: number;
    y: number;
    degree: number;
};

type SimLink = { source: SimNode | string; target: SimNode | string };

const truncate = (title: string, max = 18): string => {
    const clean = title.trim() || 'Sin título';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const nodeRadius = (node: SimNode): number =>
    7 + Math.min(11, node.degree * 1.6);

/** Grafo global con layout de fuerzas (d3-force) y nodos tocables. */
export default function KnowledgeGraph({
    graph,
    width,
    height,
    onOpen,
}: KnowledgeGraphProps) {
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
                x: width / 2 + Math.cos(angle) * 18,
                y: height / 2 + Math.sin(angle) * 18,
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
                    .distance(76)
                    .strength(0.6)
            )
            .force('charge', forceManyBody().strength(-130))
            .force('center', forceCenter(width / 2, height / 2))
            .force(
                'collide',
                forceCollide((node: any) => nodeRadius(node) + 4)
            )
            .stop();

        for (let index = 0; index < 300; index += 1) {
            simulation.tick();
        }

        nodes.forEach((node) => {
            node.x = Math.max(26, Math.min(width - 26, node.x));
            node.y = Math.max(26, Math.min(height - 26, node.y));
        });

        return { nodes, links };
    }, [graph, width, height]);

    const resolve = (value: SimNode | string): SimNode | null => {
        if (typeof value !== 'string') return value;
        return layout.nodes.find((node) => node.id === value) ?? null;
    };

    const showAllLabels = layout.nodes.length <= 60;

    return (
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {layout.links.map((link, index) => {
                const source = resolve(link.source);
                const target = resolve(link.target);
                if (!source || !target) return null;

                return (
                    <Line
                        key={`edge-${index}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#e1e1e1"
                        strokeWidth={1}
                    />
                );
            })}

            {layout.nodes.map((node) => {
                const radius = nodeRadius(node);
                const showLabel =
                    showAllLabels || node.pinned || node.degree >= 3;

                return (
                    <G key={node.id} onPress={() => onOpen(node.id)}>
                        <Circle
                            cx={node.x}
                            cy={node.y}
                            r={radius}
                            fill={node.pinned ? '#fff7ed' : '#fff'}
                            stroke={node.pinned ? '#b45309' : '#6b6b6b'}
                            strokeWidth={1.4}
                        />
                        {showLabel && (
                            <SvgText
                                x={node.x}
                                y={node.y + radius + 10}
                                fontSize={8}
                                textAnchor="middle"
                                fill="#37352f"
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
