import { conflictsLabel, dayTitle, taskDuration, weekTitle } from '@shared/schedule'
import type { ScheduleState } from '../../hooks/useSchedule'
import { LoadingBlock } from '../Feedback'
import { DaySummary } from './DaySummary'
import { GanttTimeline } from './GanttTimeline'
import { WeekView } from './WeekView'

type PanelProps = { s: ScheduleState }

/** Título del día o de la semana y leyenda planificado/real. */
function CalendarHeader({ s }: PanelProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 className="section-title">{s.prefs.mode === 'week' ? weekTitle(s.day) : dayTitle(s.day)}</h2>
      <div className="flex items-center gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-accent/40 bg-accent/10" aria-hidden="true" />
          Planificado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-accent shadow-glow-sm" aria-hidden="true" />
          Real
        </span>
      </div>
    </div>
  )
}

function ConflictAlert({ count }: { count: number }) {
  return (
    <p
      role="alert"
      className="mx-4 mt-3 rounded-lg border border-danger-soft/40 bg-danger/10 px-3 py-2 text-xs text-danger-soft"
    >
      {conflictsLabel(count)} Abrí un bloque en conflicto para resolverlo.
    </p>
  )
}

/** Grilla del día; se remonta al cambiar de día o de zoom. */
/** Duración de la tarea elegida para "tocar y ubicar"; `null` si no hay ninguna. */
function placingMinutes(s: ScheduleState) {
  const selectedTask = s.selectedTaskId ? s.tasksById.get(s.selectedTaskId) : undefined
  return selectedTask ? taskDuration(selectedTask) : null
}

/** Ubica la tarea soltada, o la elegida con "tocar y ubicar" (`taskId` en `null`). */
function placeTaskWith(s: ScheduleState) {
  return (taskId: string | null, minute: number) => {
    const id = taskId ?? s.selectedTaskId
    if (id) void s.placeTask(id, minute)
  }
}

function DayTimeline({ s }: PanelProps) {
  return (
    <div className="pt-3">
      <GanttTimeline
        key={`${s.day.toISOString()}-${s.prefs.zoom}`}
        day={s.day}
        view={s.view}
        zoom={s.prefs.zoom}
        blocks={s.blocks}
        conflicts={s.conflicts}
        layout={s.layout}
        tasksById={s.tasksById}
        nowMinute={s.nowMinute}
        placingMinutes={placingMinutes(s)}
        onPlaceTask={placeTaskWith(s)}
        onCreateSpan={(span) => s.openEditor({ block: null, span })}
        onCommitSpan={(block, span) => void s.commitSpan(block, span)}
        onOpen={(block) => s.openEditor({ block })}
        onFocus={s.focus}
        onDelete={(block) => void s.remove(block)}
      />
    </div>
  )
}

function CalendarContent({ s }: PanelProps) {
  if (s.loading) return <LoadingBlock />
  if (s.prefs.mode === 'week') {
    return <WeekView day={s.day} blocks={s.blocks} conflicts={s.conflicts} today={new Date()} onOpenDay={s.openDay} />
  }
  return <DayTimeline s={s} />
}

/** Tarjeta del calendario: encabezado, aviso de conflictos y grilla (o semana). */
export function CalendarCard({ s }: PanelProps) {
  const isWeek = s.prefs.mode === 'week'
  return (
    <div className="pulse-card min-w-0">
      <CalendarHeader s={s} />
      {s.conflicts.size > 0 && !isWeek ? <ConflictAlert count={s.conflicts.size} /> : null}
      <CalendarContent s={s} />
    </div>
  )
}

/** Resumen del día y atajos de teclado (solo en la vista de día). */
export function DayFooter({ s }: PanelProps) {
  if (s.prefs.mode === 'week') return null
  return (
    <>
      {!s.loading ? (
        <DaySummary
          rows={s.summary.rows}
          planned={s.summary.planned}
          actual={s.summary.actual}
          adherence={s.summary.adherence}
        />
      ) : null}
      <p className="text-xs text-fg-dim">
        Teclado: Tab para elegir un bloque · ←/→ mover 15 min · Shift+←/→ ajustar el fin · Alt+←/→ ajustar el inicio ·
        Enter editar · Supr eliminar.
      </p>
    </>
  )
}
