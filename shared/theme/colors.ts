/**
 * colors.ts - Gestión centralizada de colores de la aplicación
 * 
 * Este archivo define una paleta de colores consistente para toda la aplicación.
 * Los colores están organizados por propósito (primary, secondary, text, etc.)
 * y por variantes (light, main, dark) para mantener la consistencia visual.
 */

export const colors = {
  // Colores principales
  primary: {
    light: '#6ab7ff',
    main: '#1e88e5',
    dark: '#005cb2',
    contrastText: '#ffffff',
  },
  
  // Colores secundarios
  secondary: {
    light: '#ffcc80',
    main: '#ff9800',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  
  // Colores de texto
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
  },
  
  // Fondos
  background: {
    default: '#f5f5f5',
    paper: '#e2e2e2ff',
  },
  
  // Bordes y divisiones
  border: {
    light: 'rgba(0, 0, 0, 0.12)',
    main: 'rgba(0, 0, 0, 0.23)',
  },
  
  // Estados y retroalimentación
  success: {
    light: '#81c784',
    main: '#4caf50',
    dark: '#388e3c',
  },
  error: {
    light: '#e57373',
    main: '#f44336',
    dark: '#d32f2f',
  },
  warning: {
    light: '#ffb74d',
    main: '#ff9800',
    dark: '#f57c00',
  },
  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2',
  },
  
  // Grises
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Comunes
  common: {
    black: '#000000',
    white: '#ffffff',
    malet: '#3a3a3aff',
  },
};
