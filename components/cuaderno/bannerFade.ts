import { ColorValue, DimensionValue } from 'react-native';

/**
 * Degradado del banner: blanco opaco hasta el 22% y de ahí se desvanece hasta
 * quedar totalmente visible en el borde derecho.
 *
 * Es el mismo tratamiento en la lista de tiendas y en la cabecera del panel,
 * así el banner se lee igual en ambos sitios.
 */
export const BANNER_FADE_COLORS: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
    '#ffffff',
    '#ffffff',
    'rgba(255,255,255,0)',
];

export const BANNER_FADE_LOCATIONS: readonly [number, number, ...number[]] = [0, 0.22, 1];

/** Ancho del banner respecto a su contenedor (deja libre la zona del texto). */
export const BANNER_WIDTH: DimensionValue = '92%';

/** Alto de la cabecera del panel de tienda (incluye el banner de fondo). */
export const PANEL_HEADER_HEIGHT = 112;
