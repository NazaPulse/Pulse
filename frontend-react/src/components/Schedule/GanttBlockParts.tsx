import type { PointerEvent } from 'react'

import * as schedule from '@shared/schedule'
import type { DragMode } from '@shared/schedule'
import type { TimeBlock } from '../../types/productivity'
import { Icon } from '../Icon'

type BlockAction = () => void
type DragStart = (mode: DragMode, event: PointerEvent<HTMLElement>) => void
type ClippedEdges = { before: boolean; after: boolean }

/** Evita que un clic en los botones inicie un arrastre del bloque. */
const stopDrag = (event: PointerEvent) => event.stopPropagation()

type ActionsProps = { block: TimeBlock; onFocus: BlockAction; onDelete: BlockAction }

export function BlockActions({ block, onFocus, onDelete }: ActionsProps) {
  return (
    <div className="absolute right-1 top-1 flex gap-0.5 rounded-md bg-canvas/90 p-0.5 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onPointerDown={stopDrag}
        onClick={onFocus}
        aria-label={`Enfocar ${block.title} en el Pomodoro`}
        title="Enfocar (Pomodoro)"
        className="shrink-0 rounded-md border border-accent/40 bg-accent/10 p-0.5 text-accent transition hover:bg-accent hover:text-ink"
      >
        <Icon name="focus" className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <button
        type="button"
        onPointerDown={stopDrag}
        onClick={onDelete}
        aria-label={`Eliminar ${block.title}`}
        className="shrink-0 rounded-md p-0.5 text-fg-dim transition hover:bg-danger/10 hover:text-danger-soft"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/** Barra sólida inferior: minutos reales sobre el plan. */
export function ActualBar({ block, conflict }: { block: TimeBlock; conflict: boolean }) {
  const colors = schedule.blockColors(block.category, conflict)
  return (
    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/5" aria-hidden="true">
      <div
        className="h-full rounded-r-full transition-[width] duration-500"
        style={{ width: `${schedule.actualRatio(block) * 100}%`, ...colors.actual }}
      />
    </div>
  )
}

/** Bordes redimensionables (no se muestran del lado recortado por la ventana visible). */
type ResizeHandlesProps = { clipped: ClippedEdges; onDragStart: DragStart }

export function ResizeHandles({ clipped, onDragStart }: ResizeHandlesProps) {
  return (
    <>
      {clipped.before ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-2 cursor-ew-resize hover:bg-white/20"
          onPointerDown={(event) => onDragStart('start', event)}
        />
      )}
      {clipped.after ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize hover:bg-white/20"
          onPointerDown={(event) => onDragStart('end', event)}
        />
      )}
    </>
  )
}
