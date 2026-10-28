import { conflictsLabel, dayTitle, taskDuration, updateWorkHours, weekTitle } from '@shared/schedule'
import { Alert } from '../components/Alert'
import { ErrorNotice, LoadingBlock } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { BlockEditorModal } from '../components/Schedule/BlockEditorModal'
import { DaySummary } from '../components/Schedule/DaySummary'
import { GanttTimeline } from '../components/Schedule/GanttTimeline'
import { ScheduleSidebar } from '../components/Schedule/ScheduleSidebar'
import { ScheduleToolbar } from '../components/Schedule/ScheduleToolbar'
import { UndoToast } from '../components/Schedule/UndoToast'
import { WeekView } from '../components/Schedule/WeekView'
import { useSchedule } from '../hooks/useSchedule'

const NAV_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-accent/50 hover:text-accent'

export function SchedulePage() {
  const s = useSchedule()
  const isWeek = s.prefs.mode === 'week'
  const selectedTask = s.selectedTaskId ? s.tasksById.get(s.selectedTaskId) : undefined
  const unit = isWeek ? 'Semana' : 'Día'

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="05 · Agenda"
        title="Cronograma"
        subtitle="Arrastrá tareas o arrastrá sobre la grilla para crear bloques; agendá automáticamente y compará lo planificado con el tiempo real."
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => s.goToDay(-1)} aria-label={`${unit} anterior`} className={NAV_BUTTON}>
              <Icon name="chevronLeft" className="h-4 w-4" />
            </button>
            <button type="button" onClick={s.goToToday} disabled={s.isToday} className={`${NAV_BUTTON} disabled:opacity-40`}>
              Hoy
            </button>
            <button type="button" onClick={() => s.goToDay(1)} aria-label={`${unit} siguiente`} className={NAV_BUTTON}>
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="mt-6">
        <ScheduleToolbar
          prefs={s.prefs}
          busy={s.busy}
          onPrefs={s.setPrefs}
          onWorkHours={(edge, minute) => s.setPrefs({ workHours: updateWorkHours(s.prefs.workHours, edge, minute) })}
          onAutoSchedule={() => void s.autoScheduleDay()}
          onCopyPreviousDay={() => void s.copyPreviousDay()}
        />
      </div>

      <ErrorNotice message={s.error} />
      {s.notice ? (
        <div className="mt-4 flex items-start gap-2">
          <div className="flex-1">
            <Alert variant="success">{s.notice}</Alert>
          </div>
          <button type="button" onClick={s.dismissNotice} aria-label="Cerrar aviso" className="rounded p-2 text-fg-dim hover:text-fg">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <ScheduleSidebar
          tasks={s.pending}
          scheduledIds={s.scheduledIds}
          selectedId={s.selectedTaskId}
          open={s.prefs.sidebarOpen}
          onToggle={() => s.setPrefs({ sidebarOpen: !s.prefs.sidebarOpen })}
          onSelect={s.selectTask}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="pulse-card min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="section-title">{isWeek ? weekTitle(s.day) : dayTitle(s.day)}</h2>
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

            {s.conflicts.size > 0 && !isWeek ? (
              <p role="alert" className="mx-4 mt-3 rounded-lg border border-danger-soft/40 bg-danger/10 px-3 py-2 text-xs text-danger-soft">
                {conflictsLabel(s.conflicts.size)} Abrí un bloque en conflicto para resolverlo.
              </p>
            ) : null}

            {s.loading ? (
              <LoadingBlock />
            ) : isWeek ? (
              <WeekView day={s.day} blocks={s.blocks} conflicts={s.conflicts} today={new Date()} onOpenDay={s.openDay} />
            ) : (
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
                  placingMinutes={selectedTask ? taskDuration(selectedTask) : null}
                  onPlaceTask={(taskId, minute) => {
                    const id = taskId ?? s.selectedTaskId
                    if (id) void s.placeTask(id, minute)
                  }}
                  onCreateSpan={(span) => s.openEditor({ block: null, span })}
                  onCommitSpan={(block, span) => void s.commitSpan(block, span)}
                  onOpen={(block) => s.openEditor({ block })}
                  onFocus={s.focus}
                  onDelete={(block) => void s.remove(block)}
                />
              </div>
            )}
          </div>

          {!isWeek && !s.loading ? (
            <DaySummary rows={s.summary.rows} planned={s.summary.planned} actual={s.summary.actual} adherence={s.summary.adherence} />
          ) : null}

          {!isWeek ? (
            <p className="text-xs text-fg-dim">
              Teclado: Tab para elegir un bloque · ←/→ mover 15 min · Shift+←/→ ajustar el fin · Alt+←/→ ajustar el inicio · Enter editar · Supr eliminar.
            </p>
          ) : null}
        </div>
      </div>

      {s.editor ? (
        <BlockEditorModal
          block={s.editor.block}
          span={s.editor.span}
          day={s.day}
          conflict={s.editor.block ? s.conflicts.has(s.editor.block.id) : false}
          tasksById={s.tasksById}
          onClose={s.closeEditor}
          onSave={s.saveEditor}
          onDelete={(block) => void s.remove(block)}
          onFocus={s.focus}
          onMoveToNextSlot={(block) => void s.moveToNextSlot(block)}
          onPushFollowing={(block) => void s.pushFollowing(block)}
        />
      ) : null}

      {s.undo ? <UndoToast action={s.undo} onUndo={() => void s.runUndo()} onDismiss={s.dismissUndo} /> : null}
    </section>
  )
}
