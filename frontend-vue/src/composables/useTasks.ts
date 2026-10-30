import { computed, reactive, ref } from 'vue'
import type { Ref } from 'vue'

import * as tasksLogic from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTaskDTO, Task } from '../types/productivity'
import { useConfirmDelete } from './useConfirmDelete'
import { useLoader } from './useLoader'
import { useNow } from './useNow'

const loadTasks = () => api.getTasks()

type TasksRef = Ref<Task[]>
type ErrorRef = Ref<string | null>

/**
 * Cambio de estado optimista: la UI cambia al instante y se revierte si la API falla. Mientras
 * dura, el id queda en `togglingIds`.
 */
function useTaskToggle(tasks: TasksRef, error: ErrorRef) {
  const togglingIds = ref<ReadonlySet<string>>(new Set())

  function setToggling(id: string, active: boolean) {
    const next = new Set(togglingIds.value)
    if (active) next.add(id)
    else next.delete(id)
    togglingIds.value = next
  }

  async function toggle(task: Task) {
    if (togglingIds.value.has(task.id)) return
    const status = tasksLogic.nextStatus(task)
    error.value = null
    tasks.value = tasksLogic.patchTask(tasks.value, task.id, { status })
    setToggling(task.id, true)
    try {
      tasks.value = tasksLogic.replaceTask(tasks.value, await api.updateTask(task.id, { status }))
    } catch (err) {
      tasks.value = tasksLogic.patchTask(tasks.value, task.id, { status: task.status })
      error.value = extractErrorMessage(err, tasksLogic.TASK_UPDATE_ERROR)
    } finally {
      setToggling(task.id, false)
    }
  }

  return { togglingIds, toggle }
}

/** Baja confirmada: al eliminar se quita de la lista; un error se muestra en la pantalla. */
function useTaskDelete(tasks: TasksRef, error: ErrorRef) {
  return useConfirmDelete<Task>({
    remove: (task) => api.deleteTask(task.id),
    onRemoved: (task) => {
      tasks.value = tasksLogic.removeTask(tasks.value, task.id)
    },
    onError: (message) => {
      error.value = message
    },
    errorMessage: tasksLogic.TASK_DELETE_ERROR,
  })
}

/** Estado de la pantalla de Tareas: lista, filtros, cambios optimistas y baja confirmada. */
export function useTasks() {
  const { data: tasks, loading, error } = useLoader<Task[]>(loadTasks, [], tasksLogic.TASK_LOAD_ERROR)
  const view = reactive({ ...tasksLogic.DEFAULT_TASK_VIEW })
  const { togglingIds, toggle } = useTaskToggle(tasks, error)
  const now = useNow(60_000)
  const confirmDelete = useTaskDelete(tasks, error)

  async function create(values: CreateTaskDTO) {
    tasks.value = tasksLogic.addTask(tasks.value, await api.createTask(values))
  }

  return {
    view,
    visible: computed(() => tasksLogic.visibleTasks(tasks.value, view)),
    counts: computed(() => tasksLogic.taskCounts(tasks.value, view.priority)),
    emptyMessage: computed(() => tasksLogic.emptyTasksMessage(view)),
    loading,
    error,
    togglingIds,
    now,
    toggle,
    create,
    confirmDelete,
  }
}
