import { MALET_API_URL } from '../../config/malet.config';
import {
  Note,
  NoteInput,
  NotesListResponse,
} from '../../entities/Note';
import { secureFetch } from '../../http/secureFetch';

const NOTES = `${MALET_API_URL}/notes`;

interface NotesQuery {
  search?: string;
  take?: number;
  cursor?: string | null;
}

function qs(params: NotesQuery): string {
  const search = new URLSearchParams();
  if (params.search) search.append('search', params.search);
  if (params.take) search.append('take', String(params.take));
  if (params.cursor) search.append('cursor', params.cursor);
  const str = search.toString();
  return str ? `?${str}` : '';
}

export const notesService = {
  /** Lista liviana: extracto, sin contenido completo. */
  getNotes: (query?: NotesQuery) =>
    secureFetch<NotesListResponse>({
      url: `${NOTES}${qs(query ?? {})}`,
      method: 'GET',
    }),

  getNote: (id: string) =>
    secureFetch<Note>({ url: `${NOTES}/${id}`, method: 'GET' }),

  createNote: (body: NoteInput) =>
    secureFetch<Note>({ url: NOTES, method: 'POST', body }),

  updateNote: (id: string, body: NoteInput) =>
    secureFetch<Note>({ url: `${NOTES}/${id}`, method: 'PUT', body }),

  deleteNote: (id: string) =>
    secureFetch<Note>({ url: `${NOTES}/${id}`, method: 'DELETE' }),

  restoreNote: (id: string) =>
    secureFetch<Note>({ url: `${NOTES}/${id}/restore`, method: 'PUT' }),

  hardDeleteNote: (id: string) =>
    secureFetch<{ success: boolean }>({
      url: `${NOTES}/${id}/hard`,
      method: 'DELETE',
    }),
};
