import React, { useEffect } from 'react';
import { useWalletStore } from '../shared/stores/useWalletStore';
import { useAccountStore } from '../shared/stores/useAccountStore';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { useAppStore } from '../shared/stores/useAppStore';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { logoutWallet } = useWalletStore();
  const { logoutAccount } = useAccountStore();
  const { logout: logoutAuth } = useAuthStore();
  const { setState } = useAppStore();

  useEffect(() => {
    setState({
      resetApp: async () => {
        logoutWallet();
        logoutAccount();
        await logoutAuth();
      }
    });
  }, [setState, logoutWallet, logoutAccount, logoutAuth]);

  return <>{children}</>;
}
