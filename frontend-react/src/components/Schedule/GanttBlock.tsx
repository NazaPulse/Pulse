import type { KeyboardEvent, PointerEvent } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockSpan, DragMode } from '@shared/schedule'
import type { TimeBlock } from '../../types/productivity'
import { ActualBar, BlockActions, ResizeHandles } from './GanttBlockParts'

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

type BlockPart = Pick<GanttBlockProps, 'block' | 'span' | 'conflict' | 'pastDeadline'>

const dashedLeft = { borderLeftStyle: 'dashed', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } as const
const dashedRight = { borderRightStyle: 'dashed', borderTopRightRadius: 0, borderBottomRightRadius: 0 } as const

/** Posición, colores y bordes punteados si el bloque sigue fuera de la ventana visible. */
function blockStyle(props: GanttBlockProps, clipped: { before: boolean; after: boolean }) {
  const colors = schedule.blockColors(props.block.category, props.conflict)
  return {
    ...schedule.spanStyle(props.span, props.view),
    top: props.lane * LANE_HEIGHT + 6,
    height: LANE_HEIGHT - 10,
    ...colors.planned,
    ...(clipped.before ? dashedLeft : {}),
    ...(clipped.after ? dashedRight : {}),
  }
}

function blockClass(dragging: boolean, completed: boolean) {
  return `group absolute touch-none select-none overflow-hidden rounded-lg border backdrop-blur-sm transition-shadow focus-visible:ring-2 focus-visible:ring-accent ${dragging ? 'z-20 opacity-90' : 'z-10'} ${completed ? 'opacity-60' : ''}`
}

/** Título, horario, avisos y progreso; arrastrarlo mueve el bloque. */
function BlockBody(props: BlockPart & Pick<GanttBlockProps, 'onDragStart'>) {
  const { block, span } = props
  return (
    <div
      className="flex h-full cursor-grab flex-col gap-0.5 px-3 pb-3 pt-1.5 active:cursor-grabbing"
      onPointerDown={(event) => props.onDragStart('move', event)}
    >
      <p className={`truncate text-xs font-semibold text-fg ${block.is_completed ? 'line-through' : ''}`}>
        {block.title}
      </p>
      <p className="truncate font-mono text-[0.625rem] text-fg-muted">
        {schedule.spanLabel(span)}
        {props.conflict ? <span className="ml-1.5 font-semibold text-danger-soft">· Conflicto</span> : null}
        {props.pastDeadline ? <span className="ml-1.5 font-semibold text-warn">· Después del vencimiento</span> : null}
      </p>
      <p className="truncate font-mono text-[0.625rem] text-fg-dim">{schedule.progressLabel(block)}</p>
    </div>
  )
}

/**
 * Bloque de la grilla: fondo translúcido = tiempo planificado, barra sólida inferior = minutos
 * reales. Clic = editar; bordes redimensionables, cuerpo arrastrable (con imán) y flechas del
 * teclado. Borde rojo si hay conflicto; aviso si termina después del vencimiento de su tarea.
 * Un borde punteado indica que el bloque sigue fuera de la ventana visible (medianoche o zoom).
 */
export function GanttBlock(props: GanttBlockProps) {
  const { block, span } = props
  const clipped = schedule.clippedEdges(span, props.view)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${block.title}, ${schedule.spanLabel(span)}. Enter para editar, flechas para mover (Shift: fin, Alt: inicio), Suprimir para eliminar.`}
      onKeyDown={props.onKeyDown}
      className={blockClass(props.dragging, block.is_completed)}
      style={blockStyle(props, clipped)}
      title={`${block.title} · ${schedule.spanLabel(span)} · ${schedule.progressLabel(block)}`}
    >
      <BlockBody {...props} />
      <BlockActions block={block} onFocus={props.onFocus} onDelete={props.onDelete} />
      <ActualBar block={block} conflict={props.conflict} />
      <ResizeHandles clipped={clipped} onDragStart={props.onDragStart} />
    </div>
  )
}
