/** Tamaño visual de un nodo en píxeles de pantalla, no en unidades del layout. */
export const nodeScreenRadius = (
    degree: number,
    scale: number,
    selected = false
): number => {
    const base = Math.min(9, 3 + 1.2 * Math.sqrt(Math.max(0, degree)));
    const zoom = Math.min(1.6, Math.max(0.9, Math.pow(scale, 0.35)));
    return base * zoom + (selected ? 2 : 0);
};

/** Escala relativa de los nodos al hacer zoom (sublineal, como Obsidian). */
export const nodeZoomFactor = (scale: number): number =>
    Math.min(1.6, Math.max(0.9, Math.pow(scale, 0.35)));

export const truncateLabel = (title: string, max = 22): string => {
    const clean = title.trim() || 'Sin título';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
