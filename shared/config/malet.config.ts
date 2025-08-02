import { IS_DEV_MODE } from "./malet.config.dev"

export const MALET_API_URL = IS_DEV_MODE ? "http://192.168.0.109:4000" : "https://apimalet.breadriuss.com"