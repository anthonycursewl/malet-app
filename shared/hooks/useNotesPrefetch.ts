import { useEffect } from 'react';
import { useNotesStore } from '../stores/useNotesStore';

/**
 * Precalienta la primera página de notas mientras el usuario está en otra
 * pantalla (dashboard/perfil), sin precargar la ruta en el stack: así el tap
 * encuentra los datos listos y no se duplica la pantalla.
 */
export function useNotesPrefetch(): void {
    useEffect(() => {
        const state = useNotesStore.getState();
        if (state.notes.length === 0 && !state.notesLoading) {
            void state.loadNotes({ refresh: true });
        }
    }, []);
}
