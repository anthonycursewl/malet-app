import { Platform } from 'react-native';

/**
 * typography.ts - Sistema de tipografía consistente
 * 
 * Este archivo define los estilos de texto que se usarán en toda la aplicación.
 * Incluye tamaños de fuente, pesos y estilos predefinidos para mantener
 * la consistencia en la jerarquía visual.
 */

export const typography = {
  // Tamaños de fuente
  fontSizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    h5: 16,
    body1: 16,
    body2: 14,
    caption: 12,
    button: 14,
  },
  
  // Pesos de fuente
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Fuentes
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  
  // Estilos predefinidos
  styles: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    button: {
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
  },
};

export type TypographyVariant = keyof typeof typography.styles;
