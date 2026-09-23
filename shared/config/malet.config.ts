const rawApiUrl = __DEV__
    ? process.env.EXPO_PUBLIC_MALET_API_URL_DEV?.trim()
    : process.env.EXPO_PUBLIC_MALET_API_URL_PROD?.trim();

const fallbackApiUrl = __DEV__
    ? "http://192.168.0.109:4005"
    : "https://api.fn.malet.app";

export const MALET_API_URL = (rawApiUrl && rawApiUrl.length > 0
    ? rawApiUrl
    : fallbackApiUrl
).replace(/\/+$/, "");
