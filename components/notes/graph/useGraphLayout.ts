import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
} from 'd3-force';
import { useEffect, useMemo, useState } from 'react';
import { NoteGraph, NoteGraphNode } from '@/shared/entities/Note';
import { graphLayoutSize, graphStructureKey } from '../KnowledgeGraph';

export interface LayoutNode extends NoteGraphNode {
    x: number;
    y: number;
    degree: number;
}

interface LayoutState {
    key: string;
    nodes: LayoutNode[];
}

type Position = Pick<LayoutNode, 'x' | 'y' | 'degree'>;

const CACHE_MAX = 3;
const layoutCache = new Map<string, Map<string, Position>>();

const cachePositions = (key: string, positions: Map<string, Position>) => {
    if (layoutCache.size >= CACHE_MAX) {
        const oldest = layoutCache.keys().next().value;
        if (oldest) layoutCache.delete(oldest);
    }
    layoutCache.set(key, positions);
};

const buildCached = (
    graph: NoteGraph,
    key: string
): LayoutNode[] | null => {
    const positions = layoutCache.get(key);
    if (!positions) return null;

    const nodes: LayoutNode[] = [];
    for (const node of graph.nodes) {
        const position = positions.get(node.id);
        if (!position) return null;
        nodes.push({ ...node, ...position });
    }
    return nodes;
};

/**
 * Layout de fuerzas en segundo plano. La disposición es independiente del
 * viewport: el renderer decide tamaños en píxeles de pantalla.
 */
export function useGraphLayout(
    graph: NoteGraph,
    enabled = true
): {
    layoutSize: number;
    nodes: LayoutNode[];
    edges: NoteGraph['edges'];
} | null {
    const layoutSize = graphLayoutSize(graph.nodes.length);
    const structureKey = useMemo(() => graphStructureKey(graph), [graph]);
    const [state, setState] = useState<LayoutState | null>(() => {
        if (!enabled || graph.nodes.length === 0) return null;
        const cached = buildCached(graph, structureKey);
        return cached ? { key: structureKey, nodes: cached } : null;
    });

    const active =
        state && state.key === structureKey ? state.nodes : null;

    useEffect(() => {
        if (!enabled || graph.nodes.length === 0 || active) return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const degree = new Map<string, number>();
        for (const edge of graph.edges) {
            degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
            degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
        }

        // Phyllotaxis: reparte los nodos desde el inicio y evita el racimo
        // central que producía el anillo pequeño anterior.
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const nodes: LayoutNode[] = graph.nodes.map((node, index) => {
            const angle = index * goldenAngle;
            const radius =
                layoutSize * 0.32 * Math.sqrt((index + 0.5) / graph.nodes.length);
            return {
                ...node,
                x: layoutSize / 2 + Math.cos(angle) * radius,
                y: layoutSize / 2 + Math.sin(angle) * radius,
                degree: degree.get(node.id) ?? 0,
            };
        });

        const links = graph.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
        }));

        const collisionRadius = (node: LayoutNode) =>
            layoutSize / 70 +
            Math.min(
                layoutSize / 35,
                Math.sqrt(node.degree) * (layoutSize / 220)
            ) +
            layoutSize / 90;

        const simulation = forceSimulation(nodes as any)
            .force(
                'link',
                forceLink(links as any)
                    .id((node: any) => node.id)
                    .distance(Math.max(80, layoutSize / 22))
                    .strength(0.32)
            )
            .force(
                'charge',
                forceManyBody().strength(-Math.max(160, layoutSize / 6.5))
            )
            .force('center', forceCenter(layoutSize / 2, layoutSize / 2))
            .force(
                'collide',
                forceCollide(collisionRadius as any).iterations(1)
            )
            .stop();

        const maxTicks = 140;
        const timeBudgetMs = 900;
        const startedAt = Date.now();
        let tick = 0;

        const normalize = () => {
            const xs = nodes.map((node) => node.x);
            const ys = nodes.map((node) => node.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const spread = Math.max(maxX - minX, maxY - minY, 1);
            const padding = layoutSize * 0.06;
            const factor = (layoutSize - padding * 2) / spread;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            nodes.forEach((node) => {
                node.x =
                    layoutSize / 2 + (node.x - centerX) * factor;
                node.y =
                    layoutSize / 2 + (node.y - centerY) * factor;
            });
        };

        const finish = () => {
            normalize();
            const positions = new Map<string, Position>(
                nodes.map((node) => [
                    node.id,
                    { x: node.x, y: node.y, degree: node.degree },
                ])
            );
            cachePositions(structureKey, positions);
            setState({
                key: structureKey,
                nodes: nodes.map((node) => ({ ...node })),
            });
        };

        const step = () => {
            if (cancelled) return;

            for (
                let batch = 0;
                batch < 8 &&
                tick < maxTicks &&
                Date.now() - startedAt < timeBudgetMs;
                batch += 1
            ) {
                simulation.tick();
                tick += 1;
            }

            if (
                tick < maxTicks &&
                Date.now() - startedAt < timeBudgetMs
            ) {
                timer = setTimeout(step, 0);
                return;
            }

            finish();
        };

        timer = setTimeout(step, 0);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            simulation.stop();
        };
    }, [enabled, graph, structureKey, layoutSize, active]);

    if (!enabled || !active) return null;
    return { layoutSize, nodes: active, edges: graph.edges };
}
