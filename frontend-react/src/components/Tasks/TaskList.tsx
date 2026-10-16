import { formatDateTime } from '../../lib/format'
import type { Task } from '../../lib/types'
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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 disabled:cursor-wait disabled:opacity-60"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={checkboxId}
                  className={[
                    'cursor-pointer break-words text-sm font-medium',
                    completed ? 'text-slate-400 line-through' : 'text-slate-900',
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
                    completed ? 'text-slate-400' : 'text-slate-600',
                  ].join(' ')}
                >
                  {task.description}
                </p>
              ) : null}
              {task.due_date ? (
                <p
                  className={[
                    'mt-1.5 text-xs',
                    overdue ? 'font-medium text-red-600' : 'text-slate-500',
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
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
