import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import * as tasksLogic from '@shared/tasks'
import type { TaskView } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTaskDTO, Task } from '../types/productivity'
import { useConfirmDelete } from './useConfirmDelete'
import { useLoader } from './useLoader'
import { useNow } from './useNow'

const NO_TASKS: Task[] = []
const loadTasks = () => api.getTasks()

type TasksSetter = Dispatch<SetStateAction<Task[]>>

/**
 * Cambio de estado optimista: la UI cambia al instante y se revierte si la API falla. Mientras
 * dura, el id queda en `togglingIds`.
 */
function useTaskToggle(setTasks: TasksSetter, setError: (message: string | null) => void) {
  const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(new Set())

  async function toggle(task: Task) {
    if (togglingIds.has(task.id)) return
    const status = tasksLogic.nextStatus(task)
    setError(null)
    setTasks((prev) => tasksLogic.patchTask(prev, task.id, { status }))
    setTogglingIds((prev) => new Set(prev).add(task.id))
    try {
      const updated = await api.updateTask(task.id, { status })
      setTasks((prev) => tasksLogic.replaceTask(prev, updated))
    } catch (err) {
      setTasks((prev) => tasksLogic.patchTask(prev, task.id, { status: task.status }))
      setError(extractErrorMessage(err, tasksLogic.TASK_UPDATE_ERROR))
    } finally {
      setTogglingIds((prev) => new Set([...prev].filter((id) => id !== task.id)))
    }
  }

  return { togglingIds, toggle }
}

/** Lista visible según los filtros, contadores por estado y mensaje de lista vacía. */
const listView = (tasks: Task[], view: TaskView) => ({
  visible: tasksLogic.visibleTasks(tasks, view),
  counts: tasksLogic.taskCounts(tasks, view.priority),
  emptyMessage: tasksLogic.emptyTasksMessage(view),
})

/** Baja confirmada: al eliminar se quita de la lista; un error se muestra en la pantalla. */
function useTaskDelete(setTasks: TasksSetter, setError: (message: string | null) => void) {
  return useConfirmDelete<Task>({
    remove: (task) => api.deleteTask(task.id),
    onRemoved: (task) => setTasks((prev) => tasksLogic.removeTask(prev, task.id)),
    onError: setError,
    errorMessage: tasksLogic.TASK_DELETE_ERROR,
  })
}

/** Estado de la pantalla de Tareas: lista, filtros, cambios optimistas y baja confirmada. */
export function useTasks() {
  const loader = useLoader(loadTasks, NO_TASKS, tasksLogic.TASK_LOAD_ERROR)
  const { data: tasks, setData: setTasks, setError } = loader
  const [view, setView] = useState<TaskView>(tasksLogic.DEFAULT_TASK_VIEW)
  const { togglingIds, toggle } = useTaskToggle(setTasks, setError)
  const now = useNow(60_000)
  const confirmDelete = useTaskDelete(setTasks, setError)

  async function create(values: CreateTaskDTO) {
    const created = await api.createTask(values)
    setTasks((prev) => tasksLogic.addTask(prev, created))
  }

  return {
    ...listView(tasks, view),
    view,
    changeView: (patch: Partial<TaskView>) => setView((prev) => ({ ...prev, ...patch })),
    loading: loader.loading,
    error: loader.error,
    togglingIds,
    now,
    toggle,
    create,
    confirmDelete,
  }
}
