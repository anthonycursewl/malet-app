/** Resumen de nota para el listado (sin contenido completo). */
export interface NoteSummary {
  id: string;
  title: string;
  excerpt: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Nota completa (detalle y editor). */
export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/** Body de POST /notes y PUT /notes/:id. */
export interface NoteInput {
  title?: string;
  content?: string;
  pinned?: boolean;
}

/** Respuesta del listado cursor-based. */
export interface NotesListResponse {
  data: NoteSummary[];
  nextCursor: string | null;
}

/** Título visible: una nota sin título se muestra como "Sin título". */
export const noteTitle = (note: { title?: string | null }): string =>
  note.title?.trim() || 'Sin título';

/** Fecha corta y humana para la lista/detalle. */
export const formatNoteDate = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `Hoy · ${hh}:${mm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  });
};

/** Conteo aproximado de palabras (sin bloques de código ni marcas). */
export const noteWordCount = (content: string): number => {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_~[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
};
