import { useState, useCallback, useEffect } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import { useSharedAccountStore } from '@/shared/stores/useSharedAccountStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { SharedAccount } from '@/shared/entities/SharedAccount';

export const useSAccounts = () => {
    const { getSharedAccounts, sharedAccounts, loading, deleteSharedAccount } = useSharedAccountStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SharedAccount | null>(null);
    const [shareAmount, setShareAmount] = useState('');

    const loadAccounts = useCallback(() => {
        getSharedAccounts(undefined, { refresh: true });
    }, [getSharedAccounts]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const openCreateModal = () => {
        router.push('/s-accounts/manage');
    };

    const openDetailsModal = (account: SharedAccount) => {
        setSelectedAccount(account);
        setModalVisible(true);
    };

    const closeDetailsModal = () => {
        setModalVisible(false);
        setShareAmount('');
    };

    const handleDelete = (id: string) => {
        const toastId = useToastStore.getState().add({
            type: 'info',
            message: '¿Eliminar cuenta compartida?',
            actionLabel: 'Eliminar',
            onAction: async () => {
                useToastStore.getState().update(toastId, { type: 'loading', message: 'Eliminando...', actionLabel: undefined });
                const success = await deleteSharedAccount(id);
                if (success) {
                    useToastStore.getState().update(toastId, { type: 'success', message: 'Cuenta eliminada', duration: 2000, actionLabel: undefined });
                } else {
                    useToastStore.getState().update(toastId, { type: 'error', message: 'Error al eliminar', duration: 3000, actionLabel: undefined });
                }
                setModalVisible(false);
            },
        });
    };

    const handleShare = async () => {
        if (!selectedAccount) return;

        let message = `*Detalles de Pago - Malet*\n\n`;
        message += `Para: ${selectedAccount.name}\n`;
        if (selectedAccount.account_id) message += `ID de Cuenta: ${selectedAccount.account_id}\n`;
        message += `Documento: ${selectedAccount.identification_number}\n`;

        if (shareAmount.trim()) {
            message += `\n*Monto a pagar: ${Number(shareAmount).toFixed(2)}*\n`;
        }

        try {
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const handleEdit = () => {
        if (!selectedAccount) return;
        setModalVisible(false);
        router.push(`/s-accounts/manage?id=${selectedAccount.id}`);
    };

    return {
        sharedAccounts,
        loading,
        modalVisible,
        selectedAccount,
        shareAmount,
        setShareAmount,
        loadAccounts,
        openCreateModal,
        openDetailsModal,
        closeDetailsModal,
        handleDelete,
        handleShare,
        handleEdit
    };
};
