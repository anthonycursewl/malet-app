import AsyncStorage from '@react-native-async-storage/async-storage';

interface SecureFetchOptions {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    setLoading?: (loading: boolean) => void;
}

export const secureFetch = async (options: SecureFetchOptions): Promise<{ error: string | null; response: any }> => {
    const { url, method, headers, body, setLoading } = options;

    try {
        if (setLoading) {
            setLoading(true);
        }

        const token = await AsyncStorage.getItem('token');

        const defaultHeaders: Record<string, string> = {
            'Authorization': `Bearer ${token || ''}`,
        };

        if (!(body instanceof FormData)) {
            defaultHeaders['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method,
            headers: {
                ...defaultHeaders,
                ...headers,
            },
            body: body instanceof FormData ? body : body,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Malet | ${errorData.message}`);
        }

        const data = await response.json()
        return { response: data, error: null };
    } catch (error: any) {
        return { error: error.message, response: null };
    } finally {
        if (setLoading) {
            setLoading(false);
        }
    }
}