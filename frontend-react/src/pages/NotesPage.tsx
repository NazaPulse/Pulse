import { useCallback, useEffect, useState } from 'react'

import { Alert } from '../components/Alert'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NoteCard } from '../components/Notes/NoteCard'
import { NoteComposer } from '../components/Notes/NoteComposer'
import { Spinner } from '../components/Spinner'
import { deleteNote, extractErrorMessage, getNotes } from '../lib/api'
import type { Note } from '../lib/types'

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadNotes = useCallback(async () => {
    setError(null)
    try {
      setNotes(await getNotes())
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar tus notas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  const handleCreated = useCallback((note: Note) => {
    setNotes((prev) => [note, ...prev])
  }, [])

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteNote(deleteTarget.id)
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo eliminar la nota.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escribí ideas o grabá notas de voz: el audio se sube y la nota se guarda sola al detener
        la grabación.
      </p>

      <div className="mt-6">
        <NoteComposer onCreated={handleCreated} />
      </div>

      {error ? (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Todavía no tenés notas.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          title="Eliminar nota"
          description={`¿Seguro que querés eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </section>
  )
}
