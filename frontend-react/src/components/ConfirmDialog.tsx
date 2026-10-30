import { Modal } from './Modal'
import { Spinner } from './Spinner'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmButton({ loading, label, onConfirm }: { loading: boolean; label: string; onConfirm: () => void }) {
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-danger-strong focus:outline-none focus:ring-2 focus:ring-danger-soft/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-danger/40 sm:w-36"
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          Eliminando…
        </>
      ) : (
        label
      )}
    </button>
  )
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { title, description, confirmLabel = 'Eliminar', loading, onConfirm, onCancel } = props
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-fg-soft">{description}</p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-line-strong bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-fg-soft transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Cancelar
        </button>
        <ConfirmButton loading={loading} label={confirmLabel} onConfirm={onConfirm} />
      </div>
    </Modal>
  )
}
