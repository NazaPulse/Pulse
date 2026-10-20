import { formatDateTime } from '@shared/format'
import type { Task } from '../../types/productivity'
import { PriorityBadge } from './PriorityBadge'

type TaskListProps = {
  tasks: Task[]
  /** Ids con un cambio de estado en curso (deshabilita su checkbox). */
  togglingIds: ReadonlySet<string>
  emptyMessage: string
  /** Instante de referencia para marcar tareas vencidas. */
  now: number
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({
  tasks,
  togglingIds,
  emptyMessage,
  now,
  onToggle,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="pulse-empty px-6 py-10 text-center text-sm text-fg-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line overflow-hidden pulse-card">
      {tasks.map((task) => {
        const completed = task.status === 'completed'
        const toggling = togglingIds.has(task.id)
        const overdue =
          !completed && task.due_date !== null && new Date(task.due_date).getTime() < now
        const checkboxId = `task-${task.id}`

        return (
          <li key={task.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
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
                  className={[
                    'cursor-pointer break-words text-sm font-medium',
                    completed ? 'text-fg-dim line-through' : 'text-fg',
                  ].join(' ')}
                >
                  {task.title}
                </label>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.description ? (
                <p
                  className={[
                    'mt-1 whitespace-pre-line break-words text-sm',
                    completed ? 'text-fg-dim' : 'text-fg-soft',
                  ].join(' ')}
                >
                  {task.description}
                </p>
              ) : null}
              {task.due_date ? (
                <p
                  className={[
                    'mt-1.5 text-xs',
                    overdue ? 'font-medium text-danger-soft' : 'text-fg-muted',
                  ].join(' ')}
                >
                  {overdue ? 'Vencida · ' : 'Vence '}
                  {formatDateTime(task.due_date)}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={`Eliminar "${task.title}"`}
              className="rounded-lg p-1.5 text-fg-dim transition hover:bg-danger/10 hover:text-danger-soft"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
