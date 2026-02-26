const DEFAULT_DEV_API_URL = "http://192.168.0.109:4005";
const DEFAULT_PROD_API_URL = "https://apimalet.breadriuss.com";

const rawApiUrl = process.env.EXPO_PUBLIC_MALET_API_URL?.trim();
const fallbackApiUrl = __DEV__ ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL;

export const MALET_API_URL = (rawApiUrl && rawApiUrl.length > 0
    ? rawApiUrl
    : fallbackApiUrl
).replace(/\/+$/, "");
