import type { DragEvent } from 'react'

import { TASK_DRAG_MIME, durationLabel, taskDuration } from '@shared/schedule'
import { PRIORITY_LABELS } from '@shared/tasks'
import type { Task } from '../../types/productivity'
import { Icon } from '../Icon'

type ScheduleSidebarProps = {
  tasks: Task[]
  scheduledIds: ReadonlySet<string>
  selectedId: string | null
  open: boolean
  onToggle: () => void
  onSelect: (id: string | null) => void
}

type TaskItemProps = { task: Task; selected: boolean; scheduled: boolean; onSelect: (id: string | null) => void }

function startTaskDrag(event: DragEvent, taskId: string) {
  event.dataTransfer.setData(TASK_DRAG_MIME, taskId)
  event.dataTransfer.effectAllowed = 'copy'
}

function TaskItem({ task, selected, scheduled, onSelect }: TaskItemProps) {
  return (
    <li>
      <button
        type="button"
        draggable
        aria-pressed={selected}
        onClick={() => onSelect(task.id)}
        onDragStart={(event) => startTaskDrag(event, task.id)}
        className={`flex w-full cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition active:cursor-grabbing ${selected ? 'border-accent bg-accent/15 text-fg shadow-glow-sm' : 'border-line bg-white/[0.03] text-fg-soft hover:border-accent/50 hover:text-fg'}`}
      >
        <Icon name="grip" className="h-4 w-4 shrink-0 text-fg-dim" strokeWidth={3} />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{task.title}</span>
          <span className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[0.625rem] uppercase tracking-wider text-fg-dim">
            <span>{PRIORITY_LABELS[task.priority]}</span>
            <span>{durationLabel(taskDuration(task))}</span>
            {scheduled ? <span className="text-ok">Agendada</span> : null}
          </span>
        </span>
      </button>
    </li>
  )
}

function TaskItems({ tasks, scheduledIds, selectedId, onSelect }: Omit<ScheduleSidebarProps, 'open' | 'onToggle'>) {
  return (
    <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto p-3">
      {tasks.length === 0 ? (
        <li className="pulse-empty text-sm">No tenés tareas pendientes.</li>
      ) : (
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            selected={task.id === selectedId}
            scheduled={scheduledIds.has(task.id)}
            onSelect={onSelect}
          />
        ))
      )}
    </ul>
  )
}

function SidebarHeader({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
      {open ? <p className="eyebrow">Pendientes · {count}</p> : null}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? 'Plegar panel de tareas' : 'Desplegar panel de tareas'}
        className="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-accent"
      >
        <Icon name={open ? 'chevronLeft' : 'chevronRight'} className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Aviso de "tocar y ubicar" para la tarea elegida. */
function PlacingNotice({ task, onSelect }: { task: Task; onSelect: (id: string | null) => void }) {
  return (
    <div
      role="status"
      className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent"
    >
      <span className="min-w-0 flex-1">
        Tocá una hora de la grilla para ubicar <strong className="text-fg">«{task.title}»</strong>.
      </span>
      <button type="button" onClick={() => onSelect(null)} className="font-semibold underline-offset-2 hover:underline">
        Cancelar
      </button>
    </div>
  )
}

function SidebarBody(props: Omit<ScheduleSidebarProps, 'open' | 'onToggle'>) {
  const selected = props.tasks.find((task) => task.id === props.selectedId)
  return (
    <>
      {selected ? <PlacingNotice task={selected} onSelect={props.onSelect} /> : null}
      <TaskItems {...props} />
      <p className="mt-auto border-t border-line px-3 py-2.5 text-xs text-fg-dim">
        Arrastrá una tarea a la grilla, o tocála y después tocá una hora.
      </p>
    </>
  )
}

/**
 * Panel plegable con las tareas pendientes. Se arrastran a la grilla (mouse) o se tocan y luego
 * se toca una hora ("tocar y ubicar", pensado para pantallas táctiles).
 */
export function ScheduleSidebar(props: ScheduleSidebarProps) {
  const { open, onToggle, ...body } = props
  return (
    <aside
      aria-label="Tareas pendientes"
      className={`pulse-card flex shrink-0 flex-col transition-[width] duration-300 ${open ? 'w-full lg:w-72' : 'w-full lg:w-14'}`}
    >
      <SidebarHeader count={props.tasks.length} open={open} onToggle={onToggle} />
      {open ? <SidebarBody {...body} /> : null}
    </aside>
  )
}
