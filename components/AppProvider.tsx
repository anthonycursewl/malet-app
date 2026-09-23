import React, { useEffect } from 'react';
import { useWalletStore } from '../shared/stores/useWalletStore';
import { useAccountStore } from '../shared/stores/useAccountStore';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { useAppStore } from '../shared/stores/useAppStore';
import { ToastProvider } from './Toast/ToastProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const logoutWallet = useWalletStore(s => s.logoutWallet);
  const logoutAccount = useAccountStore(s => s.logoutAccount);
  const logoutAuth = useAuthStore(s => s.logout);
  const setState = useAppStore(s => s.setState);

  useEffect(() => {
    setState({
      resetApp: async () => {
        logoutWallet();
        logoutAccount();
        await logoutAuth();
      }
    });
  }, [setState, logoutWallet, logoutAccount, logoutAuth]);

  return (
    <>
      {children}
      <ToastProvider />
    </>
  );
}
