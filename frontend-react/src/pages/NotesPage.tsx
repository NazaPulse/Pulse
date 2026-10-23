import { NOTES_LOAD_ERROR, NOTE_DELETE_ERROR, emptyNotesMessage } from '@shared/noteComposer'
import { deleteDialogDescriptionFor } from '@shared/utils/deleteTarget'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorNotice, LoadingBlock } from '../components/Feedback'
import { NoteCard } from '../components/Notes/NoteCard'
import { NoteComposer } from '../components/Notes/NoteComposer'
import { PageHeader } from '../components/PageHeader'
import { useConfirmDelete } from '../hooks/useConfirmDelete'
import { useLoader } from '../hooks/useLoader'
import { api } from '../lib/api'
import type { Note } from '../types/productivity'

const NO_NOTES: Note[] = []
const loadNotes = () => api.getNotes()

export function NotesPage() {
  const { data: notes, setData: setNotes, loading, error, setError } = useLoader(loadNotes, NO_NOTES, NOTES_LOAD_ERROR)
  const { target, setTarget, deleting, confirm } = useConfirmDelete<Note>({
    remove: (note) => api.deleteNote(note.id),
    onRemoved: (note) => setNotes((prev) => prev.filter((n) => n.id !== note.id)),
    onError: setError,
    errorMessage: NOTE_DELETE_ERROR,
  })

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="03 · Ideas"
        title="Notas"
        subtitle="Escribí ideas o grabá notas de voz: el audio se sube y la nota se guarda sola al detener la grabación."
      />

      <div className="mt-6">
        <NoteComposer onCreated={(note) => setNotes((prev) => [note, ...prev])} />
      </div>

      <ErrorNotice message={error} />

      {loading ? (
        <LoadingBlock />
      ) : notes.length === 0 ? (
        <div className="mt-6 pulse-empty px-6 py-10 text-center text-sm text-fg-muted">{emptyNotesMessage}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={setTarget} />
          ))}
        </div>
      )}

      {target ? (
        <ConfirmDialog
          title="Eliminar nota"
          description={deleteDialogDescriptionFor(target.title)}
          loading={deleting}
          onConfirm={confirm}
          onCancel={() => setTarget(null)}
        />
      ) : null}
    </section>
  )
}
