import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { MALET_API_URL } from "../config/malet.config";
import { secureFetch } from "../http/secureFetch";

interface ProfileStore {
    loading: boolean,
    setLoading: (loading: boolean) => void,
    error: string | null,
    setError: (error: string | null) => void,
    checkUsernameAvailability: (username: string) => Promise<{ error: string | null, response: any }>;
    updateProfile: (data: { name: string, username: string, newAvatar?: string, newBanner?: string }) => Promise<{ error: string | null, response: any }>;
}

function uploadWithXhr(url: string, formData: FormData): Promise<{ error: string | null, response: any }> {
    return new Promise(async (resolve) => {
        const token = await AsyncStorage.getItem('token');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${token || ''}`);

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ error: null, response: data });
                } else {
                    const message = data?.message || data?.error || `Error ${xhr.status}`;
                    resolve({ error: message, response: null });
                }
            } catch {
                resolve({ error: 'Error al procesar la respuesta del servidor', response: null });
            }
        };

        xhr.onerror = () => {
            resolve({ error: 'Error de conexión al subir la imagen', response: null });
        };

        xhr.ontimeout = () => {
            resolve({ error: 'La solicitud tardó demasiado tiempo', response: null });
        };

        xhr.timeout = 30000;
        xhr.send(formData);
    });
}

export const useProfileStore = create<ProfileStore>((set) => ({
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
    error: null,
    setError: (error: string | null) => set({ error }),

    checkUsernameAvailability: async (username: string): Promise<{ error: string | null, response: any }> => {
        set({ loading: true })
        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}/users/profile/verified/username/${username}`,
            method: 'GET',
        })

        if (error) {
            set({ error, loading: false });
            return { error, response: null };
        }

        set({ error: null, loading: false });
        return { error: null, response };
    },

    updateProfile: async (data) => {
        set({ loading: true });

        const hasFiles = data.newAvatar || data.newBanner;

        if (hasFiles) {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('username', data.username);

            if (data.newAvatar) {
                const filename = data.newAvatar.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('avatar', { uri: data.newAvatar, name: filename || 'avatar.jpg', type } as any);
            }

            if (data.newBanner) {
                const filename = data.newBanner.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('banner', { uri: data.newBanner, name: filename || 'banner.jpg', type } as any);
            }

            const { error, response } = await uploadWithXhr(
                `${MALET_API_URL}/users/profile/upload`,
                formData
            );

            if (error) {
                set({ error, loading: false });
                return { error, response: null };
            }

            set({ error: null, loading: false });
            return { error: null, response };
        }

        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}/users/profile/update`,
            method: 'PATCH',
            body: JSON.stringify({
                name: data.name,
                username: data.username
            })
        });

        if (error) {
            set({ error, loading: false });
            return { error, response: null };
        }

        set({ error: null, loading: false });
        return { error: null, response };
    }

}))