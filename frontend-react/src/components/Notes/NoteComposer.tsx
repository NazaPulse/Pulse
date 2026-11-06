import { MIC_UNSUPPORTED_MESSAGE, TITLE_MAX_LENGTH, phaseLabel } from '@shared/noteComposer'
import type { Note } from '../../types/productivity'
import { Alert } from '../Alert'
import { Icon } from '../Icon'
import { Spinner } from '../Spinner'
import { RecordingBar } from './RecordingBar'
import { useNoteComposer } from './useNoteComposer'

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60'

type Composer = ReturnType<typeof useNoteComposer>
type ComposerProps = { c: Composer }
type MicProps = ComposerProps & { micLocked: boolean }

function ComposerAlerts({ c }: ComposerProps) {
  return (
    <>
      {c.error ? <Alert variant="error">{c.error}</Alert> : null}
      {c.saved && !c.error ? <Alert variant="success">{c.saved}</Alert> : null}
      {c.recorder.error ? <Alert variant="error">{c.recorder.error}</Alert> : null}
    </>
  )
}

function ComposerInputs({ c }: ComposerProps) {
  return (
    <>
      <input
        aria-label="Título"
        placeholder="Título de la nota"
        value={c.title}
        onChange={(e) => c.setTitle(e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        disabled={c.busy}
        className="w-full border-0 border-b border-line bg-transparent px-0 py-1.5 text-base font-semibold text-fg outline-none placeholder:text-fg-dim focus:border-accent disabled:text-fg-dim"
      />
      <textarea
        aria-label="Contenido"
        placeholder="Escribí tu nota… o grabá un audio."
        rows={3}
        value={c.content}
        onChange={(e) => c.setContent(e.target.value)}
        disabled={c.busy}
        className="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-fg-soft outline-none placeholder:text-fg-dim disabled:text-fg-dim"
      />
    </>
  )
}

/** Aviso si el navegador no graba; si falta el permiso, botón para pedirlo. */
function MicPermissionControl({ c, micLocked }: MicProps) {
  const { recorder } = c
  if (recorder.permission === 'unsupported') return <p className="text-xs text-fg-muted">{MIC_UNSUPPORTED_MESSAGE}</p>
  if (recorder.permission === 'granted' || c.recording) return null
  return (
    <button
      type="button"
      onClick={() => void recorder.requestPermission()}
      disabled={micLocked}
      className={SECONDARY_BUTTON}
    >
      <Icon name="mic" className="h-4 w-4" strokeWidth={1.8} />
      {recorder.permission === 'denied' ? 'Reintentar permiso de micrófono' : 'Activar micrófono'}
    </button>
  )
}

function RecordButton({ c, micLocked }: MicProps) {
  if (c.recorder.permission === 'unsupported' || c.recording) return null
  return (
    <button
      type="button"
      onClick={() => void c.recorder.start()}
      disabled={micLocked}
      className="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-danger-strong disabled:cursor-not-allowed disabled:bg-danger/40"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
      Grabar nota de voz
    </button>
  )
}

/** Reintento de subida del último audio y estado del guardado en curso. */
function UploadStatus({ c }: ComposerProps) {
  return (
    <>
      {c.pendingAudio && !c.busy && !c.recording ? (
        <button
          type="button"
          onClick={() => void c.saveNote(c.pendingAudio)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/10"
        >
          Reintentar subida
        </button>
      ) : null}

      {c.busy ? (
        <span className="inline-flex items-center gap-2 text-sm text-fg-muted" role="status">
          <Spinner className="h-4 w-4 text-accent" />
          {phaseLabel(c.phase)}
        </span>
      ) : null}
    </>
  )
}

function ComposerToolbar({ c, micLocked }: MicProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <MicPermissionControl c={c} micLocked={micLocked} />
        <RecordButton c={c} micLocked={micLocked} />
        <UploadStatus c={c} />
      </div>

      <button
        type="submit"
        disabled={!c.canSaveText}
        className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent/30 disabled:text-ink/50 disabled:shadow-none"
      >
        Guardar nota
      </button>
    </div>
  )
}

/** Alta de notas de texto y de voz; al detener una grabación la nota se guarda sola. */
export function NoteComposer({ onCreated }: { onCreated: (note: Note) => void }) {
  const c = useNoteComposer(onCreated)
  const { recorder } = c
  const micLocked = c.busy || recorder.status === 'requesting'

  return (
    <form onSubmit={c.handleSubmit} noValidate className="flex flex-col gap-3 pulse-card p-4 sm:p-5">
      <ComposerAlerts c={c} />
      <ComposerInputs c={c} />

      {c.recording ? (
        <RecordingBar
          elapsedMs={recorder.elapsedMs}
          level={recorder.level}
          onCancel={recorder.cancel}
          onStop={recorder.stop}
        />
      ) : null}

      <ComposerToolbar c={c} micLocked={micLocked} />
    </form>
  )
}
