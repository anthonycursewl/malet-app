import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { MALET_API_URL } from '../config/malet.config';
import { TransactionTag, normalizeHexColor, normalizePalette } from '../entities/TagItem';
import { secureFetch } from '../http/secureFetch';

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

  // CRUD
  loadTags: () => Promise<void>;
  addTag: (tag: CreateTagPayload) => Promise<TransactionTag>;
  updateTag: (id: string, updates: UpdateTagPayload) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Transaction-tag association
  assignTagsToTransaction: (transactionId: string, tagIds: string[]) => Promise<boolean>;
  getTagsForTransaction: (transactionId: string) => Promise<TransactionTag[]>;
  removeTagFromTransaction: (tagId: string, transactionId: string) => Promise<boolean>;
};

export const useTagStore = create<TagStoreState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,

  loadTags: async () => {
    const cachedTagsData = await AsyncStorage.getItem('cached_tags_data');

    if (cachedTagsData) {
      const { date, tags } = JSON.parse(cachedTagsData);
      const diff = new Date().getTime() - new Date(date).getTime();

      const FIVE_MINUTES = 5 * 60 * 1000;

      if (diff < FIVE_MINUTES) {
        set({ tags, loading: false, error: null });
        return;
      }
    }

    set({ loading: true });
    const { error, response } = await secureFetch<TransactionTag[]>({
      url: `${MALET_API_URL}/tags`,
      method: 'GET',
      expectArray: true,
    });

    if (error || !response) {
      set({ error: error || 'Error cargando etiquetas', loading: false });
      return;
    }

    const newCache = {
      date: new Date().toISOString(),
      tags: response,
    };
    await AsyncStorage.setItem('cached_tags_data', JSON.stringify(newCache));

    set({ tags: response, error: null, loading: false });
  },

  addTag: async (tag) => {
    set({ loading: true });

    await AsyncStorage.removeItem('cached_tags_data');

    // Normalize before sending
    const body: CreateTagPayload = {
      name: tag.name,
    };
    if (tag.color) body.color = normalizeHexColor(tag.color);
    if (tag.palette && tag.palette.length > 0) {
      body.palette = normalizePalette(tag.palette);
    }

    const { error, response } = await secureFetch<TransactionTag>({
      url: `${MALET_API_URL}/tags`,
      method: 'POST',
      body,
    });

    if (error || !response) {
      set({ error: error || 'Error creando etiqueta', loading: false });
      throw new Error(error || 'Error creando etiqueta');
    }

    set({ tags: [response, ...get().tags], error: null, loading: false });
    return response;
  },

  updateTag: async (id, updates) => {

    set({ loading: true });
    await AsyncStorage.removeItem('cached_tags_data');

    const body: UpdateTagPayload = {};
    if (updates.name) body.name = updates.name;
    if (updates.color) body.color = normalizeHexColor(updates.color);
    if (updates.palette) body.palette = normalizePalette(updates.palette);

    const { error, response } = await secureFetch<TransactionTag>({
      url: `${MALET_API_URL}/tags/${id}`,
      method: 'PUT',
      body,
    });

    if (error || !response) {
      set({ error: error || 'Error actualizando etiqueta', loading: false });
      return;
    }

    const updated = get().tags.map(t => (t.id === id ? response : t));
    set({ tags: updated, error: null, loading: false });
  },

  deleteTag: async (id) => {
    set({ loading: true });
    await AsyncStorage.removeItem('cached_tags_data');

    const { error } = await secureFetch<{ success: boolean }>({
      url: `${MALET_API_URL}/tags/${id}`,
      method: 'DELETE',
    });

    if (error) {
      set({ error: error || 'Error eliminando etiqueta', loading: false });
      return;
    }

    const filtered = get().tags.filter(t => t.id !== id);
    set({ tags: filtered, error: null, loading: false });
  },

  assignTagsToTransaction: async (transactionId, tagIds) => {
    const { error } = await secureFetch<{ success: boolean }>({
      url: `${MALET_API_URL}/tags/transactions/${transactionId}`,
      method: 'POST',
      body: { tagIds },
    });

    if (error) {
      set({ error });
      return false;
    }
    return true;
  },

  getTagsForTransaction: async (transactionId) => {
    const { error, response } = await secureFetch<TransactionTag[]>({
      url: `${MALET_API_URL}/tags/transactions/${transactionId}`,
      method: 'GET',
      expectArray: true,
    });

    if (error || !response) return [];
    return response;
  },

  removeTagFromTransaction: async (tagId, transactionId) => {
    const { error } = await secureFetch<{ success: boolean }>({
      url: `${MALET_API_URL}/tags/${tagId}/transactions/${transactionId}`,
      method: 'DELETE',
    });

    if (error) {
      set({ error });
      return false;
    }
    return true;
  },
}));
