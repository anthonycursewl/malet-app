import { MALET_API_URL } from '../../config/malet.config';
import {
  Note,
  NoteDetail,
  NoteGraph,
  NoteInput,
  NoteLinkTarget,
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
    secureFetch<NoteDetail>({ url: `${NOTES}/${id}`, method: 'GET' }),

  /** Destinos livianos para el autocompletado de `[[`. */
  getLinkTargets: (query?: {
    search?: string;
    take?: number;
    exclude_id?: string;
  }) => {
    const search = new URLSearchParams();
    if (query?.search) search.append('search', query.search);
    if (query?.take) search.append('take', String(query.take));
    if (query?.exclude_id) search.append('exclude_id', query.exclude_id);
    const qs = search.toString();
    return secureFetch<{ data: NoteLinkTarget[] }>({
      url: `${NOTES}/link-targets${qs ? `?${qs}` : ''}`,
      method: 'GET',
    });
  },

  /** Mapa de conocimiento: nodos y aristas. */
  getGraph: () =>
    secureFetch<NoteGraph>({
      url: `${NOTES}/graph`,
      method: 'GET',
    }),

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
