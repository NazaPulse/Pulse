import { resolveMediaUrl } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { Note } from '../../lib/types'

type NoteCardProps = {
  note: Note
  onDelete: (note: Note) => void
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-slate-900">{note.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(note.created_at)}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(note)}
          aria-label={`Eliminar "${note.title}"`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {note.content ? (
        <p className="whitespace-pre-line break-words text-sm text-slate-600">{note.content}</p>
      ) : null}

      {note.audio_url ? (
        <audio controls preload="metadata" src={resolveMediaUrl(note.audio_url)} className="w-full">
          Tu navegador no soporta la reproducción de audio.
        </audio>
      ) : null}
    </article>
  )
}
