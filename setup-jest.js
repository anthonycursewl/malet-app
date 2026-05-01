jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
  loadAsync: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ type: 'success', data: { idToken: 'test-token' } })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('expo-local-authentication', () => ({
  LocalAuthentication: {
    hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
    isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
    authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};