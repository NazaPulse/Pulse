import type { ReactNode } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockSpan } from '@shared/schedule'
import { LANE_HEIGHT } from './GanttBlock'

function markClass(minute: number, view: BlockSpan) {
  if (minute === view.end) return '-translate-x-full'
  return minute === view.start ? '' : '-translate-x-1/2'
}

/** Regla de horas sobre la grilla. */
export function HourRuler({ view }: { view: BlockSpan }) {
  return (
    <div className="relative h-8 border-b border-line">
      {schedule.hourMarks(view).map((minute) => (
        <span
          key={minute}
          className={`absolute top-2 font-mono text-[0.625rem] text-fg-dim ${markClass(minute, view)}`}
          style={{ left: schedule.minuteToPercent(minute, view) }}
        >
          {schedule.formatMinute(minute)}
        </span>
      ))}
    </div>
  )
}

export function EmptyTimelineHint() {
  return (
    <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-fg-dim">
      Sin bloques. Arrastrá sobre la grilla para crear uno o soltá una tarea.
    </p>
  )
}

/** Tramo provisorio (creación o tarea por soltar). */
export function GhostSpan({ ghost, view }: { ghost: BlockSpan; view: BlockSpan }) {
  return (
    <div
      className="pointer-events-none absolute z-0 flex items-center justify-center rounded-lg border border-dashed border-accent/70 bg-accent/10 font-mono text-[0.625rem] text-accent"
      style={{ ...schedule.spanStyle(ghost, view), top: 6, height: LANE_HEIGHT - 10 }}
      aria-hidden="true"
    >
      {schedule.spanLabel(ghost)}
    </div>
  )
}

/** Línea de "ahora" (solo si cae dentro de la ventana visible). */
export function NowLine({ nowMinute, view }: { nowMinute: number | null; view: BlockSpan }) {
  if (nowMinute === null || nowMinute < view.start || nowMinute > view.end) return null
  return (
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
  )
}

/** Contenedor desplazable de la grilla (ancho mínimo según el zoom). */
export function TimelineFrame({
  minWidth,
  onMount,
  children,
}: {
  minWidth: string | number
  onMount: (container: HTMLDivElement | null) => void
  children: ReactNode
}) {
  return (
    <div ref={onMount} className="overflow-x-auto">
      <div className="relative px-4 pb-4" style={{ minWidth }}>
        {children}
      </div>
    </div>
  )
}
