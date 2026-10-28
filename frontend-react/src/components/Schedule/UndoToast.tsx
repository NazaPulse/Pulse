import type { UndoAction } from '@shared/schedule'
import { Icon } from '../Icon'

type UndoToastProps = {
  action: UndoAction
  onUndo: () => void
  onDismiss: () => void
}

/** Aviso temporal con "Deshacer" tras crear, mover, redimensionar o eliminar bloques. */
export function UndoToast({ action, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-rise items-center gap-3 rounded-xl border border-accent/40 bg-surface/95 px-4 py-3 text-sm text-fg shadow-glow backdrop-blur lg:bottom-6"
    >
      <span className="min-w-0 flex-1 truncate">{action.message}</span>
      <button type="button" onClick={onUndo} className="font-semibold text-accent underline-offset-2 hover:underline">
        Deshacer
      </button>
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="rounded p-1 text-fg-dim hover:text-fg">
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  )
}
