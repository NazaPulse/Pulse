import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert } from '../components/Alert'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Spinner } from '../components/Spinner'
import { TaskFormModal } from '../components/Tasks/TaskFormModal'
import { TaskList } from '../components/Tasks/TaskList'
import { createTask, deleteTask, extractErrorMessage, getTasks, updateTask } from '../lib/api'
import type { CreateTaskDTO, Task, TaskPriority, TaskStatus } from '../lib/types'

type StatusFilter = 'all' | TaskStatus
type SortKey = 'created' | 'priority' | 'due_date'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Más recientes' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'due_date', label: 'Vencimiento' },
]

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

function dueTime(task: Task): number {
  // Las tareas sin vencimiento van al final.
  return task.due_date ? new Date(task.due_date).getTime() : Number.POSITIVE_INFINITY
}

function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  const byCreated = (a: Task, b: Task) => b.created_at.localeCompare(a.created_at)
  return [...tasks].sort((a, b) => {
    if (sort === 'priority') {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || dueTime(a) - dueTime(b)
    }
    if (sort === 'due_date') {
      return dueTime(a) - dueTime(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    }
    return byCreated(a, b)
  })
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('created')
  const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Referencia para "vencida"; se refresca cada minuto.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const loadTasks = useCallback(async () => {
    setError(null)
    try {
      setTasks(await getTasks())
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar tus tareas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  // Se trae la lista completa una sola vez y se filtra en el cliente: así los
  // contadores de cada pestaña están siempre al día sin pedidos extra.
  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    }),
    [tasks],
  )

  const visibleTasks = useMemo(
    () => sortTasks(filter === 'all' ? tasks : tasks.filter((t) => t.status === filter), sort),
    [tasks, filter, sort],
  )

  async function handleToggle(task: Task) {
    if (togglingIds.has(task.id)) return
    const nextStatus: TaskStatus = task.status === 'pending' ? 'completed' : 'pending'

    // Actualización optimista: la UI cambia al instante y se revierte si la API falla.
    setError(null)
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
    setTogglingIds((prev) => new Set(prev).add(task.id))
    try {
      const updated = await updateTask(task.id, { status: nextStatus })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      setError(extractErrorMessage(err, 'No se pudo actualizar la tarea.'))
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  async function handleCreate(values: CreateTaskDTO) {
    const created = await createTask(values)
    setTasks((prev) => [created, ...prev])
    setFormOpen(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTask(deleteTarget.id)
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo eliminar la tarea.'))
    } finally {
      setDeleting(false)
    }
  }

  const emptyMessage =
    filter === 'pending'
      ? 'No tenés tareas pendientes. ¡Buen trabajo!'
      : filter === 'completed'
        ? 'Todavía no completaste ninguna tarea.'
        : 'No tenés tareas. Creá la primera con “+ Nueva tarea”.'

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tareas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Marcá una tarea para completarla; el cambio se guarda al instante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Nueva tarea
        </button>
      </div>

      {error ? (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1" role="tablist">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                filter === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {option.label}
              <span className="ml-1.5 text-xs text-slate-400">{counts[option.value]}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : (
          <TaskList
            tasks={visibleTasks}
            togglingIds={togglingIds}
            emptyMessage={emptyMessage}
            now={now}
            onToggle={(task) => void handleToggle(task)}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {formOpen ? (
        <TaskFormModal onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Eliminar tarea"
          description={`¿Seguro que querés eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </section>
  )
}
