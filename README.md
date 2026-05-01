# Malet-App

> Gestión de finanzas personales móvil

[![Expo](https://img.shields.io/badge/Expo-54.0.33-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Características

- **Gestión de Cuentas**: Múltiples cuentas con soporte multi-divisa
- **Transacciones**: Registro de gastos y ahorros con categorías
- **Etiquetas**: Organización personalizada con colores
- **AI Chat**: Asistente inteligente integrado
- **Garzón Wallet**: Integración con servicios externos
- **Comunidades**: Comparte y aprende con otros usuarios
- **Calculadora**: Herramienta de cálculo integrada
- **Biometría**: Autenticación segura con Face ID / Huella
- **Sincronización**: Datos en la nube

## Tech Stack

- **Framework**: Expo SDK 54
- **UI**: React Native 0.81
- **Lenguaje**: TypeScript 5.9
- **Estado**: Zustand 5.x
- **Navegación**: Expo Router 6.x
- **Estilos**: React Native StyleSheet + Linear Gradient

## Estructura del Proyecto

```
.
├── app/                    # Rutas de Expo Router
│   ├── (auth)/           # Pantallas de autenticación
│   ├── dashboard/        # Dashboard principal
│   ├── wallet/           # Gestión de cartera
│   ├── transactions/    # Historial de transacciones
│   ├── accounts/        # Gestión de cuentas
│   ├── tags/            # Etiquetas
│   ├── profile/         # Perfil de usuario
│   ├── ai/              # Chat AI
│   ├── chat/            # Mensajería
│   ├── garzon/          # Integración Garzón
│   ├── communities/     # Comunidades
│   └── calculator/     # Calculadora
│
├── components/            # Componentes React reutilizables
│   ├── auth/            # Componentes de autenticación
│   ├── dashboard/       # Componentes del dashboard
│   ├── AddWallet/       # Formulario de transacciones
│   ├── Transactions/   # Lista de transacciones
│   ├── Modals/          # Modales reutilizables
│   ├── malet-ai/        # Componentes de AI
│   ├── garzon/          # Componentes de Garzón
│   ├── communities/    # Componentes de comunidades
│   └── shared/         # Componentes compartidos
│
├── shared/               # Lógica compartida
│   ├── entities/       # Tipos TypeScript
│   ├── stores/         # Zustand stores
│   ├── services/       # Servicios API
│   ├── hooks/          # Custom hooks
│   ├── middlewares/    # Middlewares
│   ├── http/          # Cliente HTTP
│   ├── config/        # Configuración
│   └── theme/         # Tema (colores, spacing, tipografía)
│
├── svgs/                 # Iconos SVG
│   ├── auth/
│   ├── common/
│   └── dashboard/
│
└── utils/                # Utilidades
    └── soundManager.ts # Gestor de sonidos
```

## Requisitos Previos

- Node.js 18+
- npm 9+
- Expo CLI
- Expo Go (móvil) o Android Studio (build local)

## Getting Started

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd malet-app

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# O conExpo Go en el móvil
# Escanea el QR de la terminal
```

### Build Android

```bash
# Usando EAS (recomendado)
eas build -p android --profile apk

# O build local (requiere Android Studio)
npx expo run:android
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
EXPO_PUBLIC_MALET_API_URL=https://tu-api.com
```

### Biometría

La app usa Face ID / Touch ID para autenticación. Configura en `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-local-authentication", {
        "faceIDPermission": "Malet usa reconocimiento facial para proteger tu cuenta."
      }]
    ]
  }
}
```

## API Reference

El backend debe exponer los siguientes endpoints:

### Autenticación
- `POST /users/save` - Registrar usuario
- `POST /users/login` - Iniciar sesión
- `POST /auth/google/mobile` - Login con Google
- `GET /auth/verify` - Verificar sesión

### Cuentas
- `POST /accounts/create` - Crear cuenta
- `PUT /accounts/update/:id` - Actualizar cuenta
- `GET /accounts/get/all` - Listar cuentas
- `DELETE /accounts/delete/:id` - Eliminar cuenta

### Transacciones
- `POST /transactions/save` - Crear transacción
- `GET /transactions/history` - Historial paginado
- `PUT /transactions/complete/:id` - Completar transacción pendiente
- `DELETE /transactions/delete/:id` - Eliminar transacción

### AI
- `GET /ai/health` - Verificar estado
- `POST /ai/chat` - Chat con IA

## Contributing

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Add nueva caracteristica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

Desarrollado con ❤️ por [Breadriuss](https://breadriuss.com)