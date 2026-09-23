import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureFetchOrThrow } from '../http/secureFetch';
import { MALET_API_URL } from '../config/malet.config';

const QUEUE_KEY = '@offline_queue';

export interface OfflineOp {
    id: string;
    entityType: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
    createdAt: string;
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function endpointFor(entityType: string, action: string, payload?: any): { url: string; method: HttpMethod } {
    switch (entityType) {
        case 'accounts':
            if (action === 'create') return { url: `${MALET_API_URL}/accounts/create`, method: 'POST' };
            if (action === 'update') return { url: `${MALET_API_URL}/accounts/${payload?.id}`, method: 'PUT' };
            if (action === 'delete') return { url: `${MALET_API_URL}/accounts/${payload?.id}`, method: 'DELETE' };
            return { url: `${MALET_API_URL}/accounts/${payload?.id}`, method: 'PUT' };
        case 'transactions':
            if (action === 'create') return { url: `${MALET_API_URL}/transactions/save`, method: 'POST' };
            if (action === 'update') return { url: `${MALET_API_URL}/transactions/${payload?.id}`, method: 'PUT' };
            if (action === 'delete') return { url: `${MALET_API_URL}/transactions/${payload?.id}`, method: 'DELETE' };
            return { url: `${MALET_API_URL}/transactions/${payload?.id}`, method: 'PUT' };
        case 'transaction_tag':
        case 'tags':
            if (action === 'create') return { url: `${MALET_API_URL}/tags`, method: 'POST' };
            if (action === 'update') return { url: `${MALET_API_URL}/tags/${payload?.id}`, method: 'PUT' };
            if (action === 'delete') return { url: `${MALET_API_URL}/tags/${payload?.id}`, method: 'DELETE' };
            return { url: `${MALET_API_URL}/tags/${payload?.id}`, method: 'PUT' };
        case 'shared_accounts':
            if (action === 'create') return { url: `${MALET_API_URL}/shared/accounts`, method: 'POST' };
            if (action === 'update') return { url: `${MALET_API_URL}/shared/accounts/${payload?.id}`, method: 'PUT' };
            if (action === 'delete') return { url: `${MALET_API_URL}/shared/accounts/${payload?.id}`, method: 'DELETE' };
            return { url: `${MALET_API_URL}/shared/accounts/${payload?.id}`, method: 'PUT' };
        case 'transaction_tag_assignments':
        case 'transaction_tag_assignment':
            if (action === 'create') return { url: `${MALET_API_URL}/tags/transactions/${payload?.transaction_id}`, method: 'POST' };
            if (action === 'delete') return { url: `${MALET_API_URL}/tags/${payload?.tag_id}/transactions/${payload?.transaction_id}`, method: 'DELETE' };
            return { url: `${MALET_API_URL}/tags/transactions/${payload?.transaction_id}`, method: 'POST' };
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}

export const offlineQueue = {
    getPending: async (): Promise<OfflineOp[]> => {
        try {
            const raw = await AsyncStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    enqueue: async (op: Omit<OfflineOp, 'id' | 'createdAt'>): Promise<void> => {
        const pending = await offlineQueue.getPending();
        pending.push({ ...op, id: generateId(), createdAt: new Date().toISOString() });
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
    },

    clear: async (): Promise<void> => {
        await AsyncStorage.removeItem(QUEUE_KEY);
    },

    flush: async (): Promise<{ success: number; failed: { id: string; error: string }[] }> => {
        const pending = await offlineQueue.getPending();
        if (pending.length === 0) return { success: 0, failed: [] };

        const failed: { id: string; error: string }[] = [];

        for (const op of pending) {
            try {
                const { url, method } = endpointFor(op.entityType, op.action, op.payload);
                const body = op.action !== 'delete' ? op.payload : undefined;
                await secureFetchOrThrow({ url, method, body });
            } catch (e: any) {
                failed.push({ id: op.id, error: e?.message ?? 'Unknown error' });
            }
        }

        const successful = pending.filter((op) => !failed.find((f) => f.id === op.id));
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed.length > 0 ? pending.filter((op) => failed.find((f) => f.id === op.id)) : []));

        return { success: successful.length, failed };
    },

    getCount: async (): Promise<number> => {
        const pending = await offlineQueue.getPending();
        return pending.length;
    },
};
