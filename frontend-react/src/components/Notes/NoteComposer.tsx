import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'

import { createNote, extractErrorMessage, uploadAudioNote } from '../../lib/api'
import { formatClock, formatDateTime } from '../../lib/format'
import type { CreateNoteDTO, Note } from '../../lib/types'
import { Alert } from '../Alert'
import { Spinner } from '../Spinner'
import { MAX_RECORDING_MS, useAudioRecorder } from './useAudioRecorder'

const TITLE_MAX_LENGTH = 200

type SavePhase = 'idle' | 'uploading' | 'saving'

type NoteComposerProps = {
  onCreated: (note: Note) => void
}

/**
 * Alta de notas de texto y de voz. Al detener una grabación el audio se sube a
 * `POST /api/notes/upload-audio` y la nota se guarda automáticamente con la
 * `audio_url` obtenida (más el título y el texto escritos, si los hay).
 */
export function NoteComposer({ onCreated }: NoteComposerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  // Audio cuya subida o guardado falló: se conserva para reintentar sin regrabar.
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null)

  const busy = phase !== 'idle'

  const saveNote = useCallback(
    async (audio: Blob | null) => {
      setError(null)
      setSaved(null)
      try {
        const payload: CreateNoteDTO = {
          title:
            title.trim() ||
            (audio ? `Nota de voz · ${formatDateTime(new Date().toISOString())}` : ''),
        }
        const trimmedContent = content.trim()
        if (trimmedContent) payload.content = trimmedContent

        if (audio) {
          setPhase('uploading')
          const { audio_url } = await uploadAudioNote(audio)
          payload.audio_url = audio_url
        }

        setPhase('saving')
        const note = await createNote(payload)
        onCreated(note)
        setTitle('')
        setContent('')
        setPendingAudio(null)
        setSaved(audio ? 'Nota de voz guardada.' : 'Nota guardada.')
      } catch (err) {
        if (audio) setPendingAudio(audio)
        setError(
          extractErrorMessage(
            err,
            audio ? 'No se pudo subir la nota de voz.' : 'No se pudo guardar la nota.',
          ),
        )
      } finally {
        setPhase('idle')
      }
    },
    [title, content, onCreated],
  )

  const recorder = useAudioRecorder({ onRecorded: (blob) => void saveNote(blob) })
  const recording = recorder.status === 'recording'

  const canSaveText = title.trim().length > 0 && !busy && !recording

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSaveText) void saveNote(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {saved && !error ? <Alert variant="success">{saved}</Alert> : null}
      {recorder.error ? <Alert variant="error">{recorder.error}</Alert> : null}

      <input
        aria-label="Título"
        placeholder="Título de la nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        disabled={busy}
        className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1.5 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 disabled:text-slate-400"
      />
      <textarea
        aria-label="Contenido"
        placeholder="Escribí tu nota… o grabá un audio."
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={busy}
        className="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:text-slate-400"
      />

      {recording ? (
        <div
          className="flex items-center gap-3 rounded-xl bg-red-50 px-3.5 py-2.5"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-red-700">
            {formatClock(recorder.elapsedMs)}
          </span>
          <span className="hidden text-xs text-red-600/80 sm:inline">
            / {formatClock(MAX_RECORDING_MS)} máx.
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-red-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-red-500 transition-[width] duration-75"
              style={{ width: `${Math.round(recorder.level * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={recorder.cancel}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={recorder.stop}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-white" aria-hidden="true" />
            Detener
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {recorder.permission === 'unsupported' ? (
            <p className="text-xs text-slate-500">
              Tu navegador no permite grabar audio (se requiere HTTPS o localhost).
            </p>
          ) : recorder.permission !== 'granted' && !recording ? (
            <button
              type="button"
              onClick={() => void recorder.requestPermission()}
              disabled={busy || recorder.status === 'requesting'}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MicIcon />
              {recorder.permission === 'denied' ? 'Reintentar permiso de micrófono' : 'Activar micrófono'}
            </button>
          ) : null}

          {recorder.permission !== 'unsupported' && !recording ? (
            <button
              type="button"
              onClick={() => void recorder.start()}
              disabled={busy || recorder.status === 'requesting'}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
              Grabar nota de voz
            </button>
          ) : null}

          {pendingAudio && !busy && !recording ? (
            <button
              type="button"
              onClick={() => void saveNote(pendingAudio)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
            >
              Reintentar subida
            </button>
          ) : null}

          {busy ? (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500" role="status">
              <Spinner className="h-4 w-4 text-indigo-600" />
              {phase === 'uploading' ? 'Subiendo audio…' : 'Guardando nota…'}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!canSaveText}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          Guardar nota
        </button>
      </div>
    </form>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
