import { Alert } from 'react-native';
import { useState } from 'react';
import { Receipt } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify, notifyUndo } from './format';

/**
 * Borrado de recibos: **solo el dueño de la tienda** (el backend también lo
 * exige, esto es la puerta de entrada). Pide confirmación, avisa mientras se
 * elimina y ofrece “Deshacer” porque el borrado es lógico.
 */
export function useDeleteReceipt() {
    const user = useAuthStore((s) => s.user);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const deleteReceipt = useSalesModuleStore((s) => s.deleteReceipt);
    const restoreReceipt = useSalesModuleStore((s) => s.restoreReceipt);

    /** Hay un borrado en curso (la pantalla muestra el velo de carga). */
    const [deleting, setDeleting] = useState(false);

    const isOwner = currentStore?.user_id === user?.id;

    const confirmDelete = (receipt: Receipt, onDeleted?: () => void) => {
        if (!isOwner) {
            notify('error', 'Solo el dueño de la tienda puede eliminar recibos.');
            return;
        }

        Alert.alert(
            'Eliminar recibo',
            `¿Deseas eliminar el recibo ${receipt.number}? Podrás deshacerlo mientras el aviso esté visible.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const error = await deleteReceipt(receipt.id);
                            if (error) {
                                notify('error', error);
                                return;
                            }

                            notifyUndo(
                                `Recibo ${receipt.number} eliminado.`,
                                async () => {
                                    const restoreError = await restoreReceipt(receipt.id);
                                    if (restoreError) notify('error', restoreError);
                                }
                            );
                            onDeleted?.();
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return { isOwner, deleting, confirmDelete };
}
