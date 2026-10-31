/** Resumen de nota para el listado (sin contenido completo). */
export interface NoteSummary {
  id: string;
  title: string;
  excerpt: string;
  word_count: number;
  pinned: boolean;
  is_public: boolean;
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
  is_public: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/** Body de POST /notes y PUT /notes/:id. */
export interface NoteInput {
  title?: string;
  content?: string;
  pinned?: boolean;
  is_public?: boolean;
}

/** Respuesta del listado cursor-based. */
export interface NotesListResponse {
  data: NoteSummary[];
  nextCursor: string | null;
}

/** Enlace saliente guardado por el backend. */
export interface NoteLink {
    source_note_id: string;
    target_note_id: string | null;
    raw_title: string;
    alias: string | null;
}

/** Detalle de nota con enlaces salientes y backlinks. */
export interface NoteDetail extends Note {
    links: NoteLink[];
    backlinks: NoteSummary[];
}

/** Resultado liviano para el picker de `[[`. */
export interface NoteLinkTarget {
    id: string;
    title: string;
}

/** Nodo del mapa de conocimiento. */
export interface NoteGraphNode {
    id: string;
    title: string;
    pinned: boolean;
    is_public: boolean;
}

/** Arista entre dos notas. */
export interface NoteGraphEdge {
    source: string;
    target: string;
}

/** Grafo completo del usuario. */
export interface NoteGraph {
    nodes: NoteGraphNode[];
    edges: NoteGraphEdge[];
    truncated: boolean;
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
