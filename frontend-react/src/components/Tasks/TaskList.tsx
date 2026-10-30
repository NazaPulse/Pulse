import { dueLabel } from '@shared/tasks'
import type { Task } from '../../types/productivity'
import { IconButton } from '../IconButton'
import { PriorityBadge } from './PriorityBadge'

type TaskRowProps = {
  task: Task
  /** Hay un cambio de estado en curso (deshabilita el checkbox). */
  toggling: boolean
  /** Instante de referencia para marcar tareas vencidas. */
  now: number
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
}

/** Descripción opcional de la tarea. */
function TaskDescription({ text, completed }: { text: string | null | undefined; completed: boolean }) {
  if (!text) return null
  return (
    <p className={`mt-1 whitespace-pre-line break-words text-sm ${completed ? 'text-fg-dim' : 'text-fg-soft'}`}>{text}</p>
  )
}

/** Vencimiento de la tarea, resaltado cuando está vencida. */
function TaskDue({ task, now }: { task: Task; now: number }) {
  const due = dueLabel(task, now)
  if (!due) return null
  return <p className={`mt-1.5 text-xs ${due.overdue ? 'font-medium text-danger-soft' : 'text-fg-muted'}`}>{due.text}</p>
}

/** Título, prioridad, descripción y vencimiento de la tarea. */
function TaskDetails({ task, now, checkboxId }: { task: Task; now: number; checkboxId: string }) {
  const completed = task.status === 'completed'
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={checkboxId}
          className={`cursor-pointer break-words text-sm font-medium ${completed ? 'text-fg-dim line-through' : 'text-fg'}`}
        >
          {task.title}
        </label>
        <PriorityBadge priority={task.priority} />
      </div>
      <TaskDescription text={task.description} completed={completed} />
      <TaskDue task={task} now={now} />
    </div>
  )
}

function TaskRow(props: TaskRowProps) {
  const { task, toggling, onToggle, onDelete } = props
  const checkboxId = `task-${task.id}`

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.status === 'completed'}
        disabled={toggling}
        aria-busy={toggling}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-accent disabled:cursor-wait disabled:opacity-60"
      />

      <TaskDetails task={task} now={props.now} checkboxId={checkboxId} />

      <IconButton icon="trash" label={`Eliminar "${task.title}"`} tone="danger" onClick={() => onDelete(task)} />
    </li>
  )
}

type TaskListProps = {
  tasks: Task[]
  /** Ids con un cambio de estado en curso. */
  togglingIds: ReadonlySet<string>
  emptyMessage: string
  now: number
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList(props: TaskListProps) {
  const { tasks, togglingIds, now, onToggle, onDelete } = props
  if (tasks.length === 0) {
    return <div className="pulse-empty px-6 py-10 text-center text-sm text-fg-muted">{props.emptyMessage}</div>
  }

  return (
    <ul className="divide-y divide-line overflow-hidden pulse-card">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          toggling={togglingIds.has(task.id)}
          now={now}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
