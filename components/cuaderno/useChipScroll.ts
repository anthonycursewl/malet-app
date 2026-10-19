import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView } from 'react-native';

/**
 * Auto-scroll para filas horizontales de chips: al elegir una opción, la fila
 * se desplaza para **centrar** ese chip y así se ve claramente cuál quedó activo.
 *
 * Uso:
 *   const { scrollRef, onViewportLayout, onChipLayout, scrollToChip } = useChipScroll();
 *   <ScrollView ref={scrollRef} onLayout={onViewportLayout} horizontal>
 *     {items.map((i) => (
 *       <Chip key={i.id} onLayout={onChipLayout(i.id)} onPress={() => { select(i.id); scrollToChip(i.id); }} />
 *     ))}
 *   </ScrollView>
 */
export function useChipScroll() {
    const scrollRef = useRef<ScrollView>(null);
    const layouts = useRef<Record<string, { x: number; width: number }>>({});
    const [viewportWidth, setViewportWidth] = useState(0);

    const onViewportLayout = useCallback((event: LayoutChangeEvent) => {
        setViewportWidth(event.nativeEvent.layout.width);
    }, []);

    /** Guarda la posición de cada chip dentro del contenido. */
    const onChipLayout = useCallback(
        (key: string) => (event: LayoutChangeEvent) => {
            const { x, width } = event.nativeEvent.layout;
            layouts.current[key] = { x, width };
        },
        []
    );

    /** Centra el chip indicado (si ya está centrado no mueve nada visible). */
    const scrollToChip = useCallback(
        (key: string) => {
            const layout = layouts.current[key];
            if (!layout || viewportWidth === 0) return;

            const centered = layout.x - (viewportWidth - layout.width) / 2;
            scrollRef.current?.scrollTo({ x: Math.max(0, centered), animated: true });
        },
        [viewportWidth]
    );

    return { scrollRef, onViewportLayout, onChipLayout, scrollToChip };
}
