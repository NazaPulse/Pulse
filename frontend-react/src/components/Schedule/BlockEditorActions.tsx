import type { TimeBlock } from '../../types/productivity'
import { SECONDARY_BUTTON } from './BlockEditorFields'

type BlockAction = (block: TimeBlock) => void

export function ConflictActions({
  block,
  onMoveToNextSlot,
  onPushFollowing,
}: {
  block: TimeBlock
  onMoveToNextSlot: BlockAction
  onPushFollowing: BlockAction
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-danger-soft/40 bg-danger/10 p-3 text-xs text-danger-soft"
    >
      Este bloque se superpone con otro.
      <div className="flex flex-wrap gap-2">
        <button type="button" className={SECONDARY_BUTTON} onClick={() => onMoveToNextSlot(block)}>
          Mover al siguiente hueco libre
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={() => onPushFollowing(block)}>
          Correr los bloques siguientes
        </button>
      </div>
    </div>
  )
}

export function BlockFooterActions({
  block,
  onFocus,
  onDelete,
}: {
  block: TimeBlock
  onFocus: BlockAction
  onDelete: BlockAction
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-line pt-3">
      <button type="button" className={SECONDARY_BUTTON} onClick={() => onFocus(block)}>
        Enfocar en Pomodoro
      </button>
      <button
        type="button"
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger-soft transition hover:bg-danger/10"
        onClick={() => onDelete(block)}
      >
        Eliminar bloque
      </button>
    </div>
  )
}
