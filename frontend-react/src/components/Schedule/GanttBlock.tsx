import type { KeyboardEvent, PointerEvent } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockSpan, DragMode } from '@shared/schedule'
import type { TimeBlock } from '../../types/productivity'
import { Icon } from '../Icon'

export const LANE_HEIGHT = 76

type GanttBlockProps = {
  block: TimeBlock
  span: BlockSpan
  view: BlockSpan
  lane: number
  conflict: boolean
  pastDeadline: boolean
  dragging: boolean
  onDragStart: (mode: DragMode, event: PointerEvent<HTMLElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onFocus: () => void
  onDelete: () => void
}

/** Evita que un clic en los botones inicie un arrastre del bloque. */
const stopDrag = (event: PointerEvent) => event.stopPropagation()

/**
 * Bloque de la grilla: fondo translúcido = tiempo planificado, barra sólida inferior = minutos
 * reales. Clic = editar; bordes redimensionables, cuerpo arrastrable (con imán) y flechas del
 * teclado. Borde rojo si hay conflicto; aviso si termina después del vencimiento de su tarea.
 * Un borde punteado indica que el bloque sigue fuera de la ventana visible (medianoche o zoom).
 */
export function GanttBlock(props: GanttBlockProps) {
  const { block, span, view, lane, conflict, pastDeadline, dragging } = props
  const colors = schedule.blockColors(block.category, conflict)
  const ratio = schedule.actualRatio(block)
  const clipped = schedule.clippedEdges(span, view)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${block.title}, ${schedule.spanLabel(span)}. Enter para editar, flechas para mover (Shift: fin, Alt: inicio), Suprimir para eliminar.`}
      onKeyDown={props.onKeyDown}
      className={`group absolute touch-none select-none overflow-hidden rounded-lg border backdrop-blur-sm transition-shadow focus-visible:ring-2 focus-visible:ring-accent ${dragging ? 'z-20 opacity-90' : 'z-10'} ${block.is_completed ? 'opacity-60' : ''}`}
      style={{
        ...schedule.spanStyle(span, view),
        top: lane * LANE_HEIGHT + 6,
        height: LANE_HEIGHT - 10,
        ...colors.planned,
        ...(clipped.before ? { borderLeftStyle: 'dashed', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}),
        ...(clipped.after ? { borderRightStyle: 'dashed', borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}),
      }}
      title={`${block.title} · ${schedule.spanLabel(span)} · ${schedule.progressLabel(block)}`}
    >
      <div
        className="flex h-full cursor-grab flex-col gap-0.5 px-3 pb-3 pt-1.5 active:cursor-grabbing"
        onPointerDown={(event) => props.onDragStart('move', event)}
      >
        <p className={`truncate text-xs font-semibold text-fg ${block.is_completed ? 'line-through' : ''}`}>
          {block.title}
        </p>
        <p className="truncate font-mono text-[0.625rem] text-fg-muted">
          {schedule.spanLabel(span)}
          {conflict ? <span className="ml-1.5 font-semibold text-danger-soft">· Conflicto</span> : null}
          {pastDeadline ? <span className="ml-1.5 font-semibold text-warn">· Después del vencimiento</span> : null}
        </p>
        <p className="truncate font-mono text-[0.625rem] text-fg-dim">{schedule.progressLabel(block)}</p>
      </div>

      <div className="absolute right-1 top-1 flex gap-0.5 rounded-md bg-canvas/90 p-0.5 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onPointerDown={stopDrag}
          onClick={props.onFocus}
          aria-label={`Enfocar ${block.title} en el Pomodoro`}
          title="Enfocar (Pomodoro)"
          className="shrink-0 rounded-md border border-accent/40 bg-accent/10 p-0.5 text-accent transition hover:bg-accent hover:text-ink"
        >
          <Icon name="focus" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onPointerDown={stopDrag}
          onClick={props.onDelete}
          aria-label={`Eliminar ${block.title}`}
          className="shrink-0 rounded-md p-0.5 text-fg-dim transition hover:bg-danger/10 hover:text-danger-soft"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/5" aria-hidden="true">
        <div
          className="h-full rounded-r-full transition-[width] duration-500"
          style={{ width: `${ratio * 100}%`, ...colors.actual }}
        />
      </div>

      {clipped.before ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-2 cursor-ew-resize hover:bg-white/20"
          onPointerDown={(event) => props.onDragStart('start', event)}
        />
      )}
      {clipped.after ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize hover:bg-white/20"
          onPointerDown={(event) => props.onDragStart('end', event)}
        />
      )}
    </div>
  )
}
