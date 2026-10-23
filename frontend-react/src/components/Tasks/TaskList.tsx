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

function TaskRow({ task, toggling, now, onToggle, onDelete }: TaskRowProps) {
  const completed = task.status === 'completed'
  const due = dueLabel(task, now)
  const checkboxId = `task-${task.id}`

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <input
        id={checkboxId}
        type="checkbox"
        checked={completed}
        disabled={toggling}
        aria-busy={toggling}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-accent disabled:cursor-wait disabled:opacity-60"
      />

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
        {task.description ? (
          <p className={`mt-1 whitespace-pre-line break-words text-sm ${completed ? 'text-fg-dim' : 'text-fg-soft'}`}>
            {task.description}
          </p>
        ) : null}
        {due ? (
          <p className={`mt-1.5 text-xs ${due.overdue ? 'font-medium text-danger-soft' : 'text-fg-muted'}`}>
            {due.text}
          </p>
        ) : null}
      </div>

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

export function TaskList({ tasks, togglingIds, emptyMessage, now, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="pulse-empty px-6 py-10 text-center text-sm text-fg-muted">{emptyMessage}</div>
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
