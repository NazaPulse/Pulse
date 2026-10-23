// Reglas de Tareas independientes del framework: filtros, orden, estados optimistas, formulario y
// presentación de prioridades. Los componentes de cada frontend solo las conectan a su estado.
import { formatDateTime } from './format'
import type { CreateTaskDTO, Task, TaskPriority, TaskStatus } from './types'

// ── Lista: filtros y orden ──────────────────────────────────

export type StatusFilter = 'all' | TaskStatus
export type PriorityFilter = 'all' | TaskPriority
export type SortKey = 'created' | 'priority' | 'due_date'

export const TASK_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

export const TASK_SORTS: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Más recientes' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'due_date', label: 'Vencimiento' },
]

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

/** Las tareas sin vencimiento van al final. */
function dueTime(task: Task): number {
  return task.due_date ? new Date(task.due_date).getTime() : Number.POSITIVE_INFINITY
}

export function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  const byPriority = (a: Task, b: Task) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  const byDue = (a: Task, b: Task) => dueTime(a) - dueTime(b)
  const compare = {
    priority: (a: Task, b: Task) => byPriority(a, b) || byDue(a, b),
    due_date: (a: Task, b: Task) => byDue(a, b) || byPriority(a, b),
    created: (a: Task, b: Task) => b.created_at.localeCompare(a.created_at),
  }[sort]
  return [...tasks].sort(compare)
}

/** Vista de la lista: pestaña de estado, filtro de prioridad y orden. */
export interface TaskView {
  status: StatusFilter
  priority: PriorityFilter
  sort: SortKey
}

export const DEFAULT_TASK_VIEW: TaskView = { status: 'all', priority: 'all', sort: 'created' }

export function filterByPriority(tasks: Task[], priority: PriorityFilter): Task[] {
  return priority === 'all' ? tasks : tasks.filter((task) => task.priority === priority)
}

function filterByStatus(tasks: Task[], status: StatusFilter): Task[] {
  return status === 'all' ? tasks : tasks.filter((task) => task.status === status)
}

/** Se trae la lista completa una vez y se filtra en el cliente: los contadores siempre están al día. */
export function taskCounts(tasks: Task[], priority: PriorityFilter = 'all'): Record<StatusFilter, number> {
  const scoped = filterByPriority(tasks, priority)
  return {
    all: scoped.length,
    pending: filterByStatus(scoped, 'pending').length,
    completed: filterByStatus(scoped, 'completed').length,
  }
}

export function visibleTasks(tasks: Task[], view: TaskView): Task[] {
  return sortTasks(filterByStatus(filterByPriority(tasks, view.priority), view.status), view.sort)
}

export function emptyTasksMessage(view: TaskView): string {
  if (view.status === 'pending') return 'No tenés tareas pendientes. ¡Buen trabajo!'
  if (view.status === 'completed') return 'Todavía no completaste ninguna tarea.'
  if (view.priority !== 'all') return 'No hay tareas con esa prioridad.'
  return 'No tenés tareas. Creá la primera con “+ Nueva tarea”.'
}

export const TASK_LOAD_ERROR = 'No se pudieron cargar tus tareas.'
export const TASK_UPDATE_ERROR = 'No se pudo actualizar la tarea.'
export const TASK_DELETE_ERROR = 'No se pudo eliminar la tarea.'

// ── Cambios locales (actualización optimista) ───────────────

export const nextStatus = (task: Task): TaskStatus => (task.status === 'pending' ? 'completed' : 'pending')

export const patchTask = (tasks: Task[], id: string, patch: Partial<Task>): Task[] =>
  tasks.map((task) => (task.id === id ? { ...task, ...patch } : task))

export const replaceTask = (tasks: Task[], updated: Task): Task[] =>
  tasks.map((task) => (task.id === updated.id ? updated : task))

export const removeTask = (tasks: Task[], id: string): Task[] => tasks.filter((task) => task.id !== id)

export const addTask = (tasks: Task[], created: Task): Task[] => [created, ...tasks]

// ── Presentación ────────────────────────────────────────────

export const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Baja', medium: 'Media', high: 'Alta' }

export const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: PRIORITY_LABELS.high },
  { value: 'medium', label: PRIORITY_LABELS.medium },
  { value: 'low', label: PRIORITY_LABELS.low },
]

export const PRIORITY_BADGE: Record<TaskPriority, { chip: string; dot: string }> = {
  low: { chip: 'bg-ok/10 text-ok ring-ok/30', dot: 'bg-ok' },
  medium: { chip: 'bg-warn/10 text-warn ring-warn/30', dot: 'bg-warn' },
  high: { chip: 'bg-danger/10 text-danger-soft ring-danger-soft/30', dot: 'bg-danger-soft' },
}

export function isOverdue(task: Task, now: number): boolean {
  return task.status !== 'completed' && task.due_date !== null && new Date(task.due_date).getTime() < now
}

/** Leyenda del vencimiento, o `null` si la tarea no tiene. */
export function dueLabel(task: Task, now: number): { text: string; overdue: boolean } | null {
  if (!task.due_date) return null
  const overdue = isOverdue(task, now)
  return { text: `${overdue ? 'Vencida · ' : 'Vence '}${formatDateTime(task.due_date)}`, overdue }
}

// ── Formulario de alta ──────────────────────────────────────

export const TASK_TITLE_MAX_LENGTH = 200
export const TASK_DESCRIPTION_MAX_LENGTH = 1000
export const DUE_DATE_PAST_MESSAGE = 'La fecha de vencimiento no puede estar en el pasado.'
export const TASK_CREATE_ERROR = 'No se pudo crear la tarea.'

export const PRIORITY_OPTIONS: { value: TaskPriority; active: string }[] = [
  { value: 'low', active: 'bg-ok-strong text-white shadow-sm' },
  { value: 'medium', active: 'bg-warn text-ink shadow-sm' },
  { value: 'high', active: 'bg-danger text-white shadow-sm' },
]

export interface TaskFormValues {
  title: string
  description: string
  priority: TaskPriority
  /** Valor de `<input type="datetime-local">`; vacío si no hay vencimiento. */
  dueDate: string
}

export const EMPTY_TASK_VALUES: TaskFormValues = { title: '', description: '', priority: 'medium', dueDate: '' }

/** Fecha/hora local actual en formato `YYYY-MM-DDTHH:mm`. */
export function nowLocalInput(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** El backend rechaza fechas pasadas (`IsNotPastDate`): se valida al editar y al enviar. */
export function isPastDate(value: string, now = Date.now()): boolean {
  return value !== '' && new Date(value).getTime() < now
}

export function canSubmitTask(values: TaskFormValues): boolean {
  const title = values.title.trim()
  return (
    title.length > 0 &&
    title.length <= TASK_TITLE_MAX_LENGTH &&
    values.description.length <= TASK_DESCRIPTION_MAX_LENGTH &&
    !isPastDate(values.dueDate)
  )
}

export function buildTaskPayload(values: TaskFormValues): CreateTaskDTO {
  const payload: CreateTaskDTO = { title: values.title.trim(), priority: values.priority }
  const description = values.description.trim()
  if (description) payload.description = description
  if (values.dueDate) payload.due_date = new Date(values.dueDate).toISOString()
  return payload
}
