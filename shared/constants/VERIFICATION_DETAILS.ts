export const VERIFICATION_DETAILS = [
    {
        id: 'business',
        type: 'malet-business-verification',
        title: '1.- Malet Business Verification',
        sections: [
            {
                title: '1.1.- ¿Qué es la verificación de tipo empresa?',
                content: 'La verificación de tipo empresa es un sello de autenticidad otorgado tras un proceso de validación realizado por el equipo de Malet. Este distintivo certifica la identidad de la marca, producto o servicio, garantizando un entorno de confianza para los usuarios. Asimismo, protege contra el fraude y la desinformación, asegurando que nuestros algoritmos categoricen y recomienden el contenido de manera precisa y acorde a la naturaleza de la empresa.'
            },
            {
                title: '1.2.- ¿Qué beneficios ofrece la verificación de tipo empresa?',
                content: 'Considera la verificación como un "Power-up" de credibilidad. Al obtener la insignia oficial de empresa:\n\n• Generas confianza inmediata en los usuarios, distinguiéndote de cuentas no oficiales.\n\n• Optimizas el algoritmo de Malet para que tus productos lleguen al nicho exacto, evitando tráfico "basura".\n\n• Proteges tu marca contra imitadores, asegurando que el crédito de tus ventas sea solo tuyo.'
            },
            {
                title: '1.3.- ¿Cómo obtener la verificación de tipo empresa?',
                content: 'Desbloquear este estatus es una misión rápida y sencilla. Dirígete a tu Perfil > Configuración y busca la sección de "Verificación". Solo necesitarás cargar la documentación que acredite la existencia legal de tu negocio. Una vez enviado, el equipo de Malet validará los datos y te enviará un correo electrónico con la confirmación de la verificación. En caso de que el proceso de verificación requiera algún documento adicional, te lo notificarán por correo electrónico. Si después de 7 días no hay confirmación, puedes contactart al correo electrónico support@malet.breadriuss.com.'
            }
        ],
        requirementsTitle: '1.4.- Requisitos para obtener la verificación de tipo empresa.',
        requirements: [
            '• La cuenta debe tener una antigüedad mínima de 60 días.',
            '• No poseer ningún bloqueo por contenido inapropiado, reporte abusivo o desinformación.',
            '• Tener una cuenta de Malet activa con email verificado.',
            '• Tener una cuenta de Malet activa con número de teléfono verificado y 2FA activado.',
            '• Tener una foto de perfil y banner de perfil válidos.'
        ],
        exampleTitle: '1.5.- Muestra de la verificación de tipo empresa y consideraciones sobre este estatus.',
        example: {
            name: 'Usuario Ejemplo',
            handle: '@usuario'
        },
        considerations: [
            '• El estatus de verificación de tipo empresa no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
            '• Si la marca sufre un cambio de nombre, se debe notificar al equipo de Malet a través del correo electrónico support@malet.breadriuss.com. Esto se hace con el fin de evitar que las cuentas que ya han sido verificadas no sean usadas para suplantar identidades de otras marcas.',
            '• Si una cuenta con este estatus se encuentra con un alto nivel de actividad sospechosa, el equipo de Malet podrá proceder a la suspensión/desactivación de la cuenta. La apelación de reportes debe hacerse antes de 7 días desde la fecha en que se le notifica al usuario.'
        ]
    },
    {
        id: 'ai',
        type: 'malet-ai-verification',
        title: '2.- Malet AI Verification',
        sections: [
            {
                title: '2.1.- ¿Qué es la verificación de tipo IA?',
                content: 'La etiqueta de "Malet AI" identifica a las cuentas automatizadas o bots que operan dentro de la plataforma. Esta distinción es crucial para mantener la transparencia, permitiendo a los usuarios saber cuándo están interactuando con un sistema automatizado en lugar de un ser humano. Es el estándar de calidad para los desarrolladores de la comunidad.'
            },
            {
                title: '2.2.- ¿Qué beneficios ofrece la verificación de IA?',
                content: 'Al verificar tu bot o integración de IA:\n\n• Generas confianza al ser transparente sobre la naturaleza automatizada de la cuenta.\n\n• Accedes a límites de API ampliados para operaciones de alta frecuencia.\n\n• Obtienes acceso anticipado a nuevas herramientas de desarrollo en Malet Developers.'
            },
            {
                title: '2.3.- ¿Cómo obtener la verificación de IA?',
                content: 'El proceso se gestiona desde el portal de desarrolladores. Debes registrar tu aplicación y vincularla a una cuenta de Malet. El equipo de revisión técnica evaluará el comportamiento del bot para asegurar que cumple con las políticas de uso, no genera spam y aporta valor a la comunidad.'
            }
        ],
        requirementsTitle: '2.4.- Requisitos para obtener la verificación de IA.',
        requirements: [
            '• La cuenta debe estar vinculada a un desarrollador verificado (Main o Business).',
            '• El nombre de la cuenta debe indicar claramente su función (ej. "SupportBot").',
            '• La biografía debe contener un enlace a la política de privacidad y términos de servicio.'
        ],
        exampleTitle: '2.5.- Muestra de la verificación de IA.',
        example: {
            name: 'Malet Assistant',
            handle: '@malet_ai'
        },
        considerations: [
            '• El estatus de verificación de tipo AI no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .'
        ]
    },
    {
        id: 'org',
        type: 'malet-org-verification',
        title: '3.- Malet Org Verification',
        sections: [
            {
                title: '3.1.- ¿Qué es la verificación de organización?',
                content: 'Esta insignia dorada/azul está reservada para organizaciones sin fines de lucro, instituciones gubernamentales, educativas y grupos comunitarios reconocidos. Valida que la cuenta representa oficialmente a la entidad en la plataforma.'
            },
            {
                title: '3.2.- Beneficios de la verificación de organización',
                content: '• Credibilidad instantánea para campañas de concientización o comunicados oficiales.\n\n• Herramientas especiales para la gestión de comunidades.\n\n• Protección prioritaria contra la suplantación de identidad.'
            },
        ],
        requirementsTitle: '3.3.- Requisitos para organizaciones.',
        requirements: [
            '• Documentación legal que acredite el estatus de la organización (Acta constitutiva, registro gubernamental, etc.).',
            '• Correo electrónico institucional verificado.',
            '• Cuenta activa con al menos 30 días de antigüedad.'
        ],
        exampleTitle: '3.4.- Muestra de la verificación de organización.',
        example: {
            name: 'Malet Foundation',
            handle: '@malet_org'
        },
        considerations: [
            '• El estatus de verificación de tipo organización no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
        ]
    },
    {
        id: 'main',
        type: 'malet-main-verification',
        title: '4.- Malet Main Verification',
        sections: [
            {
                title: '4.1.- ¿Qué es la verificación principal?',
                content: 'Es la insignia de verificación personal para figuras públicas, creadores de contenido, periodistas y usuarios destacados. Confirma que la persona detrás de la cuenta es quien dice ser y tiene una presencia relevante dentro o fuera de Malet.'
            },
            {
                title: '4.2.- Beneficios de la verificación principal',
                content: '• Distinción visual en comentarios y búsquedas.\n\n• Acceso a filtros de notificaciones avanzados.\n\n• Mayor seguridad y soporte prioritario para recuperación de cuentas.'
            },
            {
                title: '4.3.- ¿Cómo solicitarla?',
                content: 'Puedes solicitarla directamente desde la configuración de tu perfil. Se te pedirá una foto de tu documento de identidad (DNI, Pasaporte) y, en algunos casos, enlaces a otros perfiles sociales o artículos de prensa que validen tu notoriedad pública.'
            }
        ],
        requirementsTitle: '4.4.- Requisitos para la verificación principal.',
        requirements: [
            '• Identidad confirmada mediante documento oficial.',
            '• Autenticación de dos factores (2FA) activada.',
            '• Perfil completo (Foto real, nombre real o artístico, biografía).',
            '• Historial de cuenta limpio (sin suspensiones recientes).'
        ],
        exampleTitle: '4.5.- Muestra de la verificación principal.',
        example: {
            name: 'Usuario Verificado',
            handle: '@usuario'
        },
        considerations: [
            '• El estatus de verificación de tipo personal no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
            '• No es un certificado legal de identidad real.',
        ]
    }
];

export const VERIFICATION_TYPES: Record<string, { color: string; name: string; description: string }> = {
    'malet-main-verification': {
        color: '#4d4d4dff',
        name: 'Malet Main Verification',
        description: 'Esta cuenta pertenece a un usuario principal verificado.',
    },
    'malet-business-verification': {
        color: '#ce7018ff',
        name: 'Malet Business Verification',
        description: 'Esta cuenta representa una entidad empresarial verificada en Malet.',
    },
    'malet-ai-verification': {
        color: '#b041e7ff',
        name: 'Malet AI Verification',
        description: 'Esta cuenta es un producto de IA oficial de Malet.',
    },
    'malet-org-verification': {
        color: '#2372ccff',
        name: 'Malet Org Verification',
        description: 'Esta cuenta pertenece a una organización verificada.',
    },
};