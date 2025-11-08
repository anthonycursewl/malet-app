/**
 * spacing.ts - Sistema de espaciado consistente
 * 
 * Este archivo define un sistema de espaciado basado en una escala de 8px.
 * Esto asegura consistencia en los márgenes y paddings a lo largo de la aplicación.
 * 
 * Uso:
 * - Usa `spacing.small` para espaciados pequeños (8px)
 * - Usa `spacing.medium` para espaciados medianos (16px)
 * - Usa `spacing.large` para espaciados grandes (24px)
 * - Usa `spacing.getSpacing(multiplier)` para valores personalizados (ej: getSpacing(3) = 24px)
 */

const BASE_UNIT = 8; 
 
export const spacing = {
  // Espaciados predefinidos
  xsmall: BASE_UNIT / 2,    // 4px
  small: BASE_UNIT,         // 8px
  medium: BASE_UNIT * 2,    // 16px
  large: BASE_UNIT * 3,     // 24px
  xlarge: BASE_UNIT * 4,    // 32px
  xxlarge: BASE_UNIT * 5,   // 40px
  
  getSpacing: (multiplier: number): number => BASE_UNIT * multiplier,
  
  // Atajos comunes
  pagePadding: BASE_UNIT * 2, 
  cardPadding: BASE_UNIT * 2, 
  inputPadding: BASE_UNIT * 1.5, 
  buttonPadding: `${BASE_UNIT}px ${BASE_UNIT * 2}px`, 
};
