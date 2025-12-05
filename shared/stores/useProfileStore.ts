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

        let body: any;
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
            body = formData;
        } else {
            body = JSON.stringify({
                name: data.name,
                username: data.username
            });
        }

        const { error, response } = await secureFetch({
            url: `${MALET_API_URL}/users/profile/update`,
            method: 'PATCH',
            body: body
        });

        if (error) {
            set({ error, loading: false });
            return { error, response: null };
        }

        set({ error: null, loading: false });
        return { error: null, response };
    }

}))