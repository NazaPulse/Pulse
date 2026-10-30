import { updateWorkHours } from '@shared/schedule'
import type { ScheduleState } from '../../hooks/useSchedule'
import { Alert } from '../Alert'
import { Icon } from '../Icon'
import { BlockEditorModal } from './BlockEditorModal'
import { ScheduleSidebar } from './ScheduleSidebar'
import { ScheduleToolbar } from './ScheduleToolbar'

type PanelProps = { s: ScheduleState }

const NAV_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-accent/50 hover:text-accent'

/** Anterior / Hoy / Siguiente (día o semana según la vista). */
export function DayNavigation({ s }: PanelProps) {
  const unit = s.prefs.mode === 'week' ? 'Semana' : 'Día'
  return (
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
  )
}

export function ToolbarPanel({ s }: PanelProps) {
  return (
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
  )
}

export function NoticeBanner({ s }: PanelProps) {
  if (!s.notice) return null
  return (
    <div className="mt-4 flex items-start gap-2">
      <div className="flex-1">
        <Alert variant="success">{s.notice}</Alert>
      </div>
      <button
        type="button"
        onClick={s.dismissNotice}
        aria-label="Cerrar aviso"
        className="rounded p-2 text-fg-dim hover:text-fg"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Panel plegable de tareas pendientes. */
export function SidebarPanel({ s }: PanelProps) {
  return (
    <ScheduleSidebar
      tasks={s.pending}
      scheduledIds={s.scheduledIds}
      selectedId={s.selectedTaskId}
      open={s.prefs.sidebarOpen}
      onToggle={() => s.setPrefs({ sidebarOpen: !s.prefs.sidebarOpen })}
      onSelect={s.selectTask}
    />
  )
}

export function EditorDialog({ s }: PanelProps) {
  const { editor } = s
  if (!editor) return null
  return (
    <BlockEditorModal
      block={editor.block}
      span={editor.span}
      day={s.day}
      conflict={editor.block ? s.conflicts.has(editor.block.id) : false}
      tasksById={s.tasksById}
      onClose={s.closeEditor}
      onSave={s.saveEditor}
      onDelete={(block) => void s.remove(block)}
      onFocus={s.focus}
      onMoveToNextSlot={(block) => void s.moveToNextSlot(block)}
      onPushFollowing={(block) => void s.pushFollowing(block)}
    />
  )
}
