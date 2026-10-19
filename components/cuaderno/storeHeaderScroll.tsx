import { createContext, ReactNode, useContext, useMemo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type StoreHeaderScrollHandler = (
    event: NativeSyntheticEvent<NativeScrollEvent>
) => void;

/**
 * Canal de scroll del panel de tienda: la sección activa reporta su desplazamiento
 * y la cabecera se minimiza con él. Fuera del panel no hay proveedor.
 */
const StoreHeaderScrollContext = createContext<StoreHeaderScrollHandler | null>(null);

export function StoreHeaderScrollProvider({
    children,
    onScroll,
}: {
    children: ReactNode;
    onScroll: StoreHeaderScrollHandler;
}) {
    return (
        <StoreHeaderScrollContext.Provider value={onScroll}>
            {children}
        </StoreHeaderScrollContext.Provider>
    );
}

/**
 * Props de scroll que cada sección pasa a su lista para que la cabecera se
 * minimice al desplazarse. Fuera del panel devuelve `{}` (no rompe nada).
 */
export function useStoreHeaderScroll(): {
    onScroll?: StoreHeaderScrollHandler;
    scrollEventThrottle?: number;
} {
    const onScroll = useContext(StoreHeaderScrollContext);

    return useMemo(
        () => (onScroll ? { onScroll, scrollEventThrottle: 16 } : {}),
        [onScroll]
    );
}
