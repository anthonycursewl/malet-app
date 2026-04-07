export interface TransactionTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  palette?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/** @deprecated Use TransactionTag instead */
export type TagItem = TransactionTag;

/** Validates a hex color string (e.g. #ff5733 or #f00) */
export const isValidHexColor = (color: string): boolean =>
  /^#[0-9a-f]{3}([0-9a-f]{3})?$/.test(color.toLowerCase());

/** Normalizes a hex color to lowercase */
export const normalizeHexColor = (color: string): string =>
  color.toLowerCase();

/** Validates and normalizes a palette (max 4 hex colors) */
export const normalizePalette = (palette: string[]): string[] =>
  palette
    .slice(0, 4)
    .map(normalizeHexColor)
    .filter(isValidHexColor);
