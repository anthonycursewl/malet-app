export type RootStackParamList = {
  GetAllTransaction: {
    account_id: string;
  };
  transactions: {
    id: string;
  };
  // Agrega aquí otras pantallas de tu navegación
  // Ejemplo:
  // Home: undefined;
  // Profile: { userId: string };
};

// Esto ayuda con la autocompletación para navigation.navigate
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
