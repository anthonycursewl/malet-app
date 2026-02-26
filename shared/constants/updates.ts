export interface AppUpdate {
    version: string;
    title: string;
    date: string;
    features: {
        icon: 'star' | 'rocket' | 'zap' | 'shield' | 'trending-up' | 'layout' | 'message-circle' | 'pie-chart' | 'smartphone'; // Feather icon names
        title: string;
        description: string;
    }[];
}

export const LATEST_APP_VERSION = '1.2.0'; // Change this to trigger the modal again

export const APP_UPDATES: AppUpdate[] = [
    {
        version: '1.2.0',
        title: 'Nueva Experiencia y Rendimiento',
        date: 'Febrero 2026',
        features: [
            {
                icon: 'smartphone',
                title: 'Inicio de Sesión Biométrico',
                description: 'Ahora puedes acceder a Malet instantáneamente usando Face ID o Huella Dactilar en tu dispositivo.'
            },
            {
                icon: 'layout',
                title: 'Pantalla de Carga Premium',
                description: 'Hemos rediseñado la experiencia de inicio con una nueva interfaz metalizada y limpia.'
            },
            {
                icon: 'trending-up',
                title: 'Cierre de Transacciones Dinámico',
                description: 'Tus pagos pendientes ahora se pueden liquidar instantáneamente como ingresos o egresos impactando tu saldo en tiempo real.'
            }
        ]
    }
];
