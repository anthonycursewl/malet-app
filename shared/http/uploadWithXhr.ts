import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureFetchResponse } from './secureFetch';

export interface UploadOptions {
    /** Método HTTP de la subida (los endpoints de fotos usan PUT). */
    method?: 'POST' | 'PUT';
    /** Progreso de la subida (0 a 1) cuando el navegador/servidor lo reporta. */
    onProgress?: (ratio: number) => void;
    /** Tiempo máximo de espera en ms (por defecto 30 s). */
    timeoutMs?: number;
}

/**
 * Subida multipart con XMLHttpRequest.
 *
 * `fetch` no expone el progreso de subida y en React Native el `FormData` con
 * archivos locales (`{ uri, name, type }`) viaja de forma más fiable por XHR.
 */
export async function uploadWithXhr<T = unknown>(
    url: string,
    formData: FormData,
    options: UploadOptions = {}
): Promise<SecureFetchResponse<T>> {
    const { method = 'POST', onProgress, timeoutMs = 30000 } = options;

    const token = await AsyncStorage.getItem('token').catch(() => null);

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${token || ''}`);

        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && event.total > 0) {
                    onProgress(event.loaded / event.total);
                }
            };
        }

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ error: null, response: data as T, httpError: null });
                } else {
                    // Nest devuelve `message` como arreglo en errores de validación.
                    const message = data?.message || data?.error || `Error ${xhr.status}`;
                    resolve({
                        error: Array.isArray(message) ? message[0] : message,
                        response: null,
                        httpError: null,
                    });
                }
            } catch {
                resolve({
                    error: 'Error al procesar la respuesta del servidor',
                    response: null,
                    httpError: null,
                });
            }
        };

        xhr.onerror = () => {
            resolve({
                error: 'Error de conexión al subir la imagen',
                response: null,
                httpError: null,
            });
        };

        xhr.ontimeout = () => {
            resolve({
                error: 'La solicitud tardó demasiado tiempo',
                response: null,
                httpError: null,
            });
        };

        xhr.timeout = timeoutMs;
        xhr.send(formData);
    });
}
