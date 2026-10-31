import { create } from 'zustand';
import { Note, NoteInput, NoteSummary } from '../entities/Note';
import { notesService } from '../services/notes/notes.service';

interface NotesPagination {
  cursor: string | null;
  take: number;
  isEnd: boolean;
}

const freshPagination = (take = 20): NotesPagination => ({
  cursor: null,
  take,
  isEnd: false,
});

/** Descarta respuestas viejas cuando cambia la búsqueda. */
let notesRequestSeq = 0;

interface NotesStore {
  notes: NoteSummary[];
  notesLoading: boolean;
  notesPagination: NotesPagination;
  search: string;
  notesError: string | null;

  loadNotes: (opts?: { refresh?: boolean }) => Promise<void>;
  refreshNotes: () => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  clearNotesError: () => void;

  fetchNote: (id: string) => Promise<{ note: Note | null; error: string | null }>;
  createNote: (body: NoteInput) => Promise<{ note: Note | null; error: string | null }>;
  updateNote: (
    id: string,
    body: NoteInput
  ) => Promise<{ note: Note | null; error: string | null }>;
  togglePin: (note: NoteSummary) => Promise<string | null>;
  deleteNote: (id: string) => Promise<string | null>;
  restoreNote: (id: string) => Promise<string | null>;
  hardDeleteNote: (id: string) => Promise<string | null>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  notesLoading: false,
  notesPagination: freshPagination(),
  search: '',
  notesError: null,

  loadNotes: async (opts) => {
    const refresh = opts?.refresh ?? false;
    const state = get();
    if (state.notesLoading && !refresh) return;
    if (!refresh && state.notesPagination.isEnd) return;

    const requestId = ++notesRequestSeq;
    const search = state.search.trim();
    set({ notesLoading: true });

    try {
      const cursor = refresh ? null : state.notesPagination.cursor;
      const { error, response } = await notesService.getNotes({
        search: search || undefined,
        take: state.notesPagination.take,
        cursor,
      });
      if (error) throw new Error(error);
      if (requestId !== notesRequestSeq) return;

      const data = response?.data ?? [];
      const nextCursor = response?.nextCursor ?? null;
      set((s) => ({
        notes: refresh
          ? data
          : [...s.notes, ...data.filter((d) => !s.notes.some((x) => x.id === d.id))],
        notesPagination: {
          ...s.notesPagination,
          cursor: nextCursor,
          isEnd: nextCursor === null || data.length === 0,
        },
        notesLoading: false,
      }));
    } catch (e: any) {
      if (requestId !== notesRequestSeq) return;
      set((s) => ({
        notesLoading: false,
        notesPagination: { ...s.notesPagination, isEnd: true },
        notesError: e?.message ?? 'Error al cargar las notas',
      }));
    }
  },

  clearNotesError: () => set({ notesError: null }),

  refreshNotes: async () => {
    await get().loadNotes({ refresh: true });
  },

  setSearch: async (search) => {
    set({
      search,
      notesPagination: { ...get().notesPagination, cursor: null, isEnd: false },
    });
    await get().loadNotes({ refresh: true });
  },

  fetchNote: async (id) => {
    try {
      const { error, response } = await notesService.getNote(id);
      if (error || !response) {
        return { note: null, error: error ?? 'Nota no encontrada.' };
      }
      return { note: response, error: null };
    } catch (e: any) {
      return { note: null, error: e?.message ?? 'Nota no encontrada.' };
    }
  },

  createNote: async (body) => {
    try {
      const { error, response } = await notesService.createNote(body);
      if (error || !response) {
        return { note: null, error: error ?? 'Error al crear la nota' };
      }
      await get().refreshNotes();
      return { note: response, error: null };
    } catch (e: any) {
      return { note: null, error: e?.message ?? 'Error al crear la nota' };
    }
  },

  updateNote: async (id, body) => {
    try {
      const { error, response } = await notesService.updateNote(id, body);
      if (error || !response) {
        return { note: null, error: error ?? 'Error al guardar la nota' };
      }
      // Mantiene el listado coherente sin recargarlo en cada autosave.
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id
            ? {
                  ...n,
                  title: response.title,
                  pinned: response.pinned,
                  updated_at: response.updated_at,
              }
            : n
        ),
      }));
      return { note: response, error: null };
    } catch (e: any) {
      return { note: null, error: e?.message ?? 'Error al guardar la nota' };
    }
  },

  togglePin: async (note) => {
    const next = !note.pinned;
    set((s) => ({
      notes: s.notes.map((n) => (n.id === note.id ? { ...n, pinned: next } : n)),
    }));

    try {
      const { error } = await notesService.updateNote(note.id, { pinned: next });
      if (error) {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === note.id ? { ...n, pinned: note.pinned } : n
          ),
        }));
        return error;
      }
      // Reordena (fijadas primero) sin esperar a volver a la pantalla.
      await get().refreshNotes();
      return null;
    } catch (e: any) {
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === note.id ? { ...n, pinned: note.pinned } : n
        ),
      }));
      return e?.message ?? 'Error al fijar la nota';
    }
  },

  deleteNote: async (id) => {
    const previous = get().notes;
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    try {
      const { error } = await notesService.deleteNote(id);
      if (error) {
        set({ notes: previous });
        return error;
      }
      return null;
    } catch (e: any) {
      set({ notes: previous });
      return e?.message ?? 'Error al eliminar la nota';
    }
  },

  restoreNote: async (id) => {
    try {
      const { error } = await notesService.restoreNote(id);
      if (error) return error;
      await get().refreshNotes();
      return null;
    } catch (e: any) {
      return e?.message ?? 'Error al restaurar la nota';
    }
  },

  hardDeleteNote: async (id) => {
    try {
      const { error } = await notesService.hardDeleteNote(id);
      if (error) return error;
      await get().refreshNotes();
      return null;
    } catch (e: any) {
      return e?.message ?? 'Error al eliminar la nota';
    }
  },
}));
