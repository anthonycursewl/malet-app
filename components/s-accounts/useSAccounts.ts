import { useState, useCallback, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { useSharedAccountStore } from '@/shared/stores/useSharedAccountStore';
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
        Alert.alert(
            "Eliminar Cuenta Compartida",
            "¿Estás seguro de que deseas eliminar esta cuenta? Se enviará a la papelera.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteSharedAccount(id);
                        setModalVisible(false);
                    }
                }
            ]
        );
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
