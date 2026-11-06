import { useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockSpan, ZoomMode } from '@shared/schedule'
import type { Task, TimeBlock } from '../../types/productivity'
import { GanttBlock, LANE_HEIGHT } from './GanttBlock'
import * as interactions from '@shared/ganttInteractions'
import type { DragState, TimelineCallbacks, TimelineContext } from '@shared/ganttInteractions'
import { EmptyTimelineHint, GhostSpan, HourRuler, NowLine, TimelineFrame } from './GanttTimelineParts'

type GanttTimelineProps = TimelineCallbacks & {
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
}

type TrackContext = TimelineContext & { ghostMinute: number | null }

function useTimelineContext(props: GanttTimelineProps, trackRef: RefObject<HTMLDivElement | null>): TrackContext {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [ghostMinute, setGhostMinute] = useState<number | null>(null)
  const trackRect = () => trackRef.current?.getBoundingClientRect() ?? { left: 0, width: 1 }
  const { day, view, blocks, placingMinutes } = props
  return {
    day,
    view,
    blocks,
    placingMinutes,
    callbacks: props,
    drag,
    setDrag,
    ghostMinute,
    setGhostMinute,
    trackRect,
  }
}

/** Al montar (una vez por día y zoom: la grilla se remonta) se desplaza hasta "ahora". */
function useScrollToStart({ zoom, nowMinute, blocks, day }: GanttTimelineProps) {
  const scrolled = useRef(false)
  return (container: HTMLDivElement | null) => {
    if (!container || scrolled.current || zoom !== 'day') return
    scrolled.current = true
    const minute = schedule.initialScrollMinute(nowMinute, blocks, day)
    container.scrollLeft = (minute / schedule.DAY_MINUTES) * container.scrollWidth
  }
}

type TrackProps = {
  ctx: TrackContext
  trackRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
  children: ReactNode
}

/** Pista de la grilla: crear arrastrando sobre el vacío y soltar tareas. */
function TimelineTrack({ ctx, trackRef, style, children }: TrackProps) {
  return (
    <div
      ref={trackRef}
      className={`relative touch-none ${ctx.placingMinutes !== null ? 'cursor-copy' : 'cursor-crosshair'}`}
      style={style}
      onPointerDown={(event) => interactions.startCreateDrag(ctx, event)}
      onPointerMove={(event) => interactions.moveDrag(ctx, event)}
      onPointerUp={() => interactions.endDrag(ctx)}
      onPointerCancel={() => ctx.setDrag(null)}
      onPointerLeave={() => !ctx.drag && ctx.setGhostMinute(null)}
      onDragOver={(event) => interactions.handleDragOver(ctx, event)}
      onDragLeave={() => ctx.setGhostMinute(null)}
      onDrop={(event) => interactions.handleDrop(ctx, event)}
    >
      {children}
    </div>
  )
}

function TimelineBlock({ block, props, ctx }: { block: TimeBlock; props: GanttTimelineProps; ctx: TimelineContext }) {
  return (
    <GanttBlock
      block={block}
      span={interactions.displayedSpan(ctx.drag, block, props.day)}
      view={props.view}
      lane={props.layout.lanes.get(block.id) ?? 0}
      conflict={props.conflicts.has(block.id)}
      pastDeadline={schedule.isPastDeadline(block, props.tasksById)}
      dragging={interactions.isDraggingBlock(ctx.drag, block)}
      onDragStart={(mode, event) => interactions.startBlockDrag(ctx, block, mode, event)}
      onKeyDown={(event) => interactions.handleBlockKey(ctx, block, event)}
      onFocus={() => props.onFocus(block)}
      onDelete={() => props.onDelete(block)}
    />
  )
}

/**
 * Grilla horizontal con línea de tiempo en vivo. Alta por drag & drop de tareas, por "tocar y
 * ubicar" (táctil) o arrastrando sobre el vacío; bloques editables con imán y teclado.
 */
export function GanttTimeline(props: GanttTimelineProps) {
  const { day, view } = props
  const trackRef = useRef<HTMLDivElement>(null)
  const ctx = useTimelineContext(props, trackRef)
  const onMount = useScrollToStart(props)
  const ghost = interactions.ghostSpan(ctx.drag, ctx.ghostMinute, props.placingMinutes)
  const visibleBlocks = props.blocks.filter((block) => schedule.isVisible(schedule.blockSpan(block, day), view))
  const grid = schedule.gridStyle(view, props.zoom)
  const trackStyle = {
    backgroundImage: grid.backgroundImage,
    backgroundSize: grid.backgroundSize,
    height: props.layout.laneCount * LANE_HEIGHT + 12,
  }

  return (
    <TimelineFrame minWidth={grid.minWidth} onMount={onMount}>
      <HourRuler view={view} />
      <TimelineTrack ctx={ctx} trackRef={trackRef} style={trackStyle}>
        {visibleBlocks.length === 0 && !ghost ? <EmptyTimelineHint /> : null}
        {ghost ? <GhostSpan ghost={ghost} view={view} /> : null}
        {visibleBlocks.map((block) => (
          <TimelineBlock key={block.id} block={block} props={props} ctx={ctx} />
        ))}
        <NowLine nowMinute={props.nowMinute} view={view} />
      </TimelineTrack>
    </TimelineFrame>
  )
}
