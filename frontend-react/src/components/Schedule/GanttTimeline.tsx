import { useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent, PointerEvent } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockSpan, DragMode, ZoomMode } from '@shared/schedule'
import type { Task, TimeBlock } from '../../types/productivity'
import { GanttBlock, LANE_HEIGHT } from './GanttBlock'

type GanttTimelineProps = {
  day: Date
  view: BlockSpan
  zoom: ZoomMode
  blocks: TimeBlock[]
  conflicts: ReadonlySet<string>
  layout: { lanes: Map<string, number>; laneCount: number }
  tasksById: ReadonlyMap<string, Task>
  nowMinute: number | null
  /** Duración de la tarea elegida para "tocar y ubicar"; `null` si no hay ninguna. */
  placingMinutes: number | null
  /** `taskId` es `null` cuando se ubica la tarea elegida con "tocar y ubicar". */
  onPlaceTask: (taskId: string | null, minute: number) => void
  onCreateSpan: (span: BlockSpan) => void
  onCommitSpan: (block: TimeBlock, span: BlockSpan) => void
  onOpen: (block: TimeBlock) => void
  onFocus: (block: TimeBlock) => void
  onDelete: (block: TimeBlock) => void
}

/** Arrastre en curso: de un bloque (mover/redimensionar) o sobre el vacío (crear un tramo). */
type DragState =
  | { kind: 'block'; block: TimeBlock; mode: DragMode; originX: number; origin: BlockSpan; preview: BlockSpan; moved: boolean }
  | { kind: 'create'; originX: number; anchor: number; preview: BlockSpan; moved: boolean }

/**
 * Grilla horizontal con línea de tiempo en vivo. Alta por drag & drop de tareas, por "tocar y
 * ubicar" (táctil) o arrastrando sobre el vacío; bloques editables con imán y teclado.
 */
export function GanttTimeline(props: GanttTimelineProps) {
  const { day, view, zoom, blocks, conflicts, layout, nowMinute } = props
  const trackRef = useRef<HTMLDivElement>(null)
  const scrolled = useRef(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [ghostMinute, setGhostMinute] = useState<number | null>(null)

  function trackRect() {
    return trackRef.current?.getBoundingClientRect() ?? { left: 0, width: 1 }
  }

  /** Al montar (una vez por día y zoom: la grilla se remonta) se desplaza hasta "ahora". */
  function scrollToStart(container: HTMLDivElement | null) {
    if (!container || scrolled.current || zoom !== 'day') return
    scrolled.current = true
    const minute = schedule.initialScrollMinute(nowMinute, blocks, day)
    container.scrollLeft = (minute / schedule.DAY_MINUTES) * container.scrollWidth
  }

  const otherSpans = (block: TimeBlock) =>
    blocks.filter((other) => other.id !== block.id).map((other) => schedule.blockSpan(other, day))

  function startBlockDrag(block: TimeBlock, mode: DragMode, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const origin = schedule.blockSpan(block, day)
    setDrag({ kind: 'block', block, mode, originX: event.clientX, origin, preview: origin, moved: false })
  }

  function startCreateDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.target !== event.currentTarget) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const anchor = schedule.minuteAtPointer(event.clientX, trackRect(), view)
    const preview = { start: anchor, end: anchor + schedule.MIN_BLOCK_MINUTES }
    setDrag({ kind: 'create', originX: event.clientX, anchor, preview, moved: false })
  }

  function moveDrag(event: PointerEvent) {
    if (!drag) {
      setGhostMinute(props.placingMinutes === null ? null : schedule.minuteAtPointer(event.clientX, trackRect(), view))
      return
    }
    const moved = drag.moved || Math.abs(event.clientX - drag.originX) >= schedule.DRAG_THRESHOLD_PX
    if (drag.kind === 'block') {
      const delta = schedule.pixelsToMinutes(event.clientX - drag.originX, trackRect().width, view)
      const raw = schedule.dragSpan(drag.origin, drag.mode, delta)
      setDrag({ ...drag, moved, preview: schedule.magnetize(raw, drag.mode, otherSpans(drag.block)) })
      return
    }
    const current = schedule.minuteAtPointer(event.clientX, trackRect(), view)
    const start = Math.min(drag.anchor, current)
    const end = Math.max(drag.anchor, current, start + schedule.MIN_BLOCK_MINUTES)
    setDrag({ ...drag, moved, preview: { start, end } })
  }

  function endDrag() {
    if (!drag) return
    setDrag(null)
    if (drag.kind === 'block') {
      if (!drag.moved) props.onOpen(drag.block)
      else if (!schedule.sameSpan(drag.origin, drag.preview)) props.onCommitSpan(drag.block, drag.preview)
      return
    }
    setGhostMinute(null)
    if (drag.moved) props.onCreateSpan(drag.preview)
    else if (props.placingMinutes !== null) props.onPlaceTask(null, drag.anchor)
  }

  function handleBlockKey(block: TimeBlock, event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onOpen(block)
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      props.onDelete(block)
      return
    }
    const mods = { shift: event.shiftKey, alt: event.altKey }
    const next = schedule.keyboardSpan(schedule.blockSpan(block, day), event.key, mods)
    if (!next) return
    event.preventDefault()
    props.onCommitSpan(block, next)
  }

  function acceptsTask(event: DragEvent) {
    return event.dataTransfer.types.includes(schedule.TASK_DRAG_MIME)
  }

  function handleDragOver(event: DragEvent) {
    if (!acceptsTask(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setGhostMinute(schedule.minuteAtPointer(event.clientX, trackRect(), view))
  }

  function handleDrop(event: DragEvent) {
    if (!acceptsTask(event)) return
    event.preventDefault()
    setGhostMinute(null)
    const minute = schedule.minuteAtPointer(event.clientX, trackRect(), view)
    props.onPlaceTask(event.dataTransfer.getData(schedule.TASK_DRAG_MIME), minute)
  }

  const ghostLength = props.placingMinutes ?? schedule.DEFAULT_DROP_MINUTES
  let ghost: BlockSpan | null = null
  if (drag?.kind === 'create') ghost = drag.preview
  else if (ghostMinute !== null) ghost = { start: ghostMinute, end: Math.min(ghostMinute + ghostLength, schedule.DAY_MINUTES) }

  const visibleBlocks = blocks.filter((block) => schedule.isVisible(schedule.blockSpan(block, day), view))
  const marks = schedule.hourMarks(view)
  const grid = schedule.gridStyle(view, zoom)

  function markClass(minute: number) {
    if (minute === view.end) return '-translate-x-full'
    return minute === view.start ? '' : '-translate-x-1/2'
  }

  return (
    <div ref={scrollToStart} className="overflow-x-auto">
      <div className="relative px-4 pb-4" style={{ minWidth: grid.minWidth }}>
        <div className="relative h-8 border-b border-line">
          {marks.map((minute) => (
            <span
              key={minute}
              className={`absolute top-2 font-mono text-[0.625rem] text-fg-dim ${markClass(minute)}`}
              style={{ left: schedule.minuteToPercent(minute, view) }}
            >
              {schedule.formatMinute(minute)}
            </span>
          ))}
        </div>

        <div
          ref={trackRef}
          className={`relative touch-none ${props.placingMinutes !== null ? 'cursor-copy' : 'cursor-crosshair'}`}
          style={{
            backgroundImage: grid.backgroundImage,
            backgroundSize: grid.backgroundSize,
            height: layout.laneCount * LANE_HEIGHT + 12,
          }}
          onPointerDown={startCreateDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={() => !drag && setGhostMinute(null)}
          onDragOver={handleDragOver}
          onDragLeave={() => setGhostMinute(null)}
          onDrop={handleDrop}
        >
          {visibleBlocks.length === 0 && !ghost ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-fg-dim">
              Sin bloques. Arrastrá sobre la grilla para crear uno o soltá una tarea.
            </p>
          ) : null}

          {ghost ? (
            <div
              className="pointer-events-none absolute z-0 flex items-center justify-center rounded-lg border border-dashed border-accent/70 bg-accent/10 font-mono text-[0.625rem] text-accent"
              style={{ ...schedule.spanStyle(ghost, view), top: 6, height: LANE_HEIGHT - 10 }}
              aria-hidden="true"
            >
              {schedule.spanLabel(ghost)}
            </div>
          ) : null}

          {visibleBlocks.map((block) => {
            const dragging = drag?.kind === 'block' && drag.block.id === block.id
            return (
              <GanttBlock
                key={block.id}
                block={block}
                span={dragging ? drag.preview : schedule.blockSpan(block, day)}
                view={view}
                lane={layout.lanes.get(block.id) ?? 0}
                conflict={conflicts.has(block.id)}
                pastDeadline={schedule.isPastDeadline(block, props.tasksById)}
                dragging={dragging}
                onDragStart={(mode, event) => startBlockDrag(block, mode, event)}
                onKeyDown={(event) => handleBlockKey(block, event)}
                onFocus={() => props.onFocus(block)}
                onDelete={() => props.onDelete(block)}
              />
            )
          })}

          {nowMinute !== null && nowMinute >= view.start && nowMinute <= view.end ? (
            <div
              className="pointer-events-none absolute -top-8 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-accent shadow-glow-sm"
              style={{ left: schedule.minuteToPercent(nowMinute, view) }}
              aria-hidden="true"
            >
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 animate-blink rounded-full bg-accent shadow-glow-sm" />
              <span className="absolute left-2 top-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold text-ink">
                {schedule.formatMinute(nowMinute)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
