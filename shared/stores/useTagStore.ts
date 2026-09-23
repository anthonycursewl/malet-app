import { create } from 'zustand';
import { MALET_API_URL } from '../config/malet.config';
import { TransactionTag, normalizeHexColor, normalizePalette } from '../entities/TagItem';
import { secureFetch } from '../http/secureFetch';
import { offlineQueue } from '../offline/offlineQueue';
import { dataCache, CACHE_KEYS } from '../offline/dataCache';
import { isOnline } from '../offline/networkUtils';
import { useSessionStore } from './useSessionStore';

interface CreateTagPayload {
    name: string;
    color?: string;
    palette?: string[];
}

interface UpdateTagPayload {
    name?: string;
    color?: string;
    palette?: string[];
}

type TagStoreState = {
    tags: TransactionTag[];
    loading: boolean;
    error: string | null;
    paginationTags: {
        cursor: string | null;
        take: number;
        isEnd: boolean;
    };

    loadTags: () => Promise<void>;
    loadTagsPage: (options?: { refresh?: boolean }) => Promise<void>;
    addTag: (tag: CreateTagPayload) => Promise<TransactionTag>;
    updateTag: (id: string, updates: UpdateTagPayload) => Promise<void>;
    deleteTag: (id: string) => Promise<void>;

    assignTagsToTransaction: (transactionId: string, tagIds: string[]) => Promise<boolean>;
    getTagsForTransaction: (transactionId: string) => Promise<TransactionTag[]>;
    removeTagFromTransaction: (tagId: string, transactionId: string) => Promise<boolean>;
};

export const useTagStore = create<TagStoreState>((set, get) => ({
    tags: [],
    loading: false,
    error: null,
    paginationTags: {
        cursor: null,
        take: 20,
        isEnd: false,
    },

    loadTags: async () => {
        await get().loadTagsPage({ refresh: true });
    },

    loadTagsPage: async (options = {}) => {
        const { refresh = false } = options;
        const state = get();

        if (state.loading) return;
        if (state.paginationTags.isEnd && !refresh) return;

        const userId = useSessionStore.getState().currentUserId;
        if (!userId) {
            set({ tags: [] });
            return;
        }

        set({ loading: true, error: null });
        try {
            if (await isOnline()) {
                const take = state.paginationTags.take;
                const cursor = refresh ? undefined : state.paginationTags.cursor ?? undefined;

                const params = new URLSearchParams({
                    take: String(take),
                });
                if (cursor) params.append('cursor', cursor);

                const { error, response } = await secureFetch<{
                    data: TransactionTag[];
                    nextCursor: string | null;
                }>({
                    url: `${MALET_API_URL}/tags?${params.toString()}`,
                    method: 'GET',
                });
                if (error) throw new Error(error);

                const data = response?.data ?? [];
                const nextCursor = response?.nextCursor ?? null;
                const isEnd = nextCursor === null || data.length === 0;

                if (refresh) {
                    set({
                        tags: data,
                        paginationTags: { cursor: nextCursor, take, isEnd },
                        error: null,
                        loading: false,
                    });
                    await dataCache.set(CACHE_KEYS.TAGS, data);
                } else {
                    set({
                        tags: [...state.tags, ...data],
                        paginationTags: { cursor: nextCursor, take, isEnd },
                        error: null,
                        loading: false,
                    });
                }
            } else {
                const cached = await dataCache.get<TransactionTag[]>(CACHE_KEYS.TAGS);
                set({ tags: cached ?? [], error: null, loading: false });
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error cargando etiquetas', loading: false });
        }
    },

    addTag: async (tag) => {
        set({ loading: true });
        const body: CreateTagPayload = { name: tag.name };
        if (tag.color) body.color = normalizeHexColor(tag.color);
        if (tag.palette && tag.palette.length > 0) {
            body.palette = normalizePalette(tag.palette);
        }

        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<TransactionTag>({
                    url: `${MALET_API_URL}/tags`,
                    method: 'POST',
                    body,
                });
                if (error || !response) throw new Error(error || 'Error creando etiqueta');
                set({ tags: [response, ...get().tags], error: null, loading: false });
                await dataCache.set(CACHE_KEYS.TAGS, get().tags);
                return response;
            } else {
                const userId = useSessionStore.getState().currentUserId ?? '';
                const offlineId = 'offline_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
                const offlineTag: TransactionTag = {
                    id: offlineId,
                    name: tag.name,
                    color: tag.color,
                    palette: tag.palette,
                    slug: tag.name.toLowerCase().replace(/\s+/g, '_'),
                    user_id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await offlineQueue.enqueue({
                    entityType: 'tags',
                    action: 'create',
                    payload: body,
                });
                set({ tags: [offlineTag, ...get().tags], error: null, loading: false });
                return offlineTag;
            }
        } catch (e: any) {
            set({ error: e?.message ?? 'Error creando etiqueta', loading: false });
            throw e;
        }
    },

    updateTag: async (id, updates) => {
        set({ loading: true });
        const body: UpdateTagPayload = {};
        if (updates.name) body.name = updates.name;
        if (updates.color) body.color = normalizeHexColor(updates.color);
        if (updates.palette) body.palette = normalizePalette(updates.palette);

        try {
            if (await isOnline()) {
                const { error, response } = await secureFetch<TransactionTag>({
                    url: `${MALET_API_URL}/tags/${id}`,
                    method: 'PUT',
                    body,
                });
                if (error || !response) throw new Error(error || 'Error actualizando etiqueta');
                const updated = get().tags.map(t => (t.id === id ? response : t));
                set({ tags: updated, error: null, loading: false });
            } else {
                await offlineQueue.enqueue({
                    entityType: 'tags',
                    action: 'update',
                    payload: { id, ...body },
                });
                const updated = get().tags.map(t => (t.id === id ? { ...t, ...body } : t));
                set({ tags: updated, error: null, loading: false });
            }
            await dataCache.set(CACHE_KEYS.TAGS, get().tags);
        } catch (e: any) {
            set({ error: e?.message ?? 'Error actualizando etiqueta', loading: false });
        }
    },

    deleteTag: async (id) => {
        set({ loading: true });
        try {
            if (await isOnline()) {
                const { error } = await secureFetch<{ success: boolean }>({
                    url: `${MALET_API_URL}/tags/${id}`,
                    method: 'DELETE',
                });
                if (error) throw new Error(error);
            } else {
                await offlineQueue.enqueue({
                    entityType: 'tags',
                    action: 'delete',
                    payload: { id },
                });
            }
            const filtered = get().tags.filter(t => t.id !== id);
            set({ tags: filtered, error: null, loading: false });
            await dataCache.set(CACHE_KEYS.TAGS, filtered);
        } catch (e: any) {
            set({ error: e?.message ?? 'Error eliminando etiqueta', loading: false });
        }
    },

    assignTagsToTransaction: async (transactionId, tagIds) => {
        try {
            if (await isOnline()) {
                const { error } = await secureFetch<{ success: boolean }>({
                    url: `${MALET_API_URL}/tags/transactions/${transactionId}`,
                    method: 'POST',
                    body: { tagIds },
                });
                if (error) return false;
            } else {
                await offlineQueue.enqueue({
                    entityType: 'transaction_tag_assignments',
                    action: 'create',
                    payload: { transaction_id: transactionId, tag_ids: tagIds },
                });
            }
            return true;
        } catch {
            return false;
        }
    },

    getTagsForTransaction: async (transactionId) => {
        try {
            if (!(await isOnline())) return [];
            const { error, response } = await secureFetch<TransactionTag[]>({
                url: `${MALET_API_URL}/tags/transactions/${transactionId}`,
                method: 'GET',
                expectArray: true,
            });
            if (error || !response) return [];
            return response;
        } catch {
            return [];
        }
    },

    removeTagFromTransaction: async (tagId, transactionId) => {
        try {
            if (await isOnline()) {
                const { error } = await secureFetch<{ success: boolean }>({
                    url: `${MALET_API_URL}/tags/${tagId}/transactions/${transactionId}`,
                    method: 'DELETE',
                });
                if (error) return false;
            } else {
                await offlineQueue.enqueue({
                    entityType: 'transaction_tag_assignments',
                    action: 'delete',
                    payload: { tag_id: tagId, transaction_id: transactionId },
                });
            }
            return true;
        } catch {
            return false;
        }
    },
}));
