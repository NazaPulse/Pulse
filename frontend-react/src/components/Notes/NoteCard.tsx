import { formatDateTime } from '@shared/format'
import { resolveMediaUrl } from '../../lib/api'
import type { Note } from '../../types/productivity'
import { IconButton } from '../IconButton'

type NoteCardProps = {
  note: Note
  onDelete: (note: Note) => void
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <article className="flex flex-col gap-3 pulse-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-fg">{note.title}</h3>
          <p className="mt-0.5 text-xs text-fg-dim">{formatDateTime(note.created_at)}</p>
        </div>
        <IconButton icon="trash" label={`Eliminar "${note.title}"`} tone="danger" onClick={() => onDelete(note)} />
      </div>

      {note.content ? (
        <p className="whitespace-pre-line break-words text-sm text-fg-soft">{note.content}</p>
      ) : null}

      {note.audio_url ? (
        <audio controls preload="metadata" src={resolveMediaUrl(note.audio_url)} className="w-full">
          Tu navegador no soporta la reproducción de audio.
        </audio>
      ) : null}
    </article>
  )
}
