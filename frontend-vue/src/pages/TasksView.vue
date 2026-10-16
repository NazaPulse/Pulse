<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import Alert from '../components/Alert.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import Spinner from '../components/Spinner.vue'
import TaskFormModal from '../components/Tasks/TaskFormModal.vue'
import TaskList from '../components/Tasks/TaskList.vue'
import { PRIORITY_LABELS } from '../components/Tasks/priority'
import { createTask, deleteTask, extractErrorMessage, getTasks, updateTask } from '../lib/api'
import type { CreateTaskDTO, Task, TaskPriority, TaskStatus } from '../types/productivity'

type StatusFilter = 'all' | TaskStatus
type PriorityFilter = 'all' | TaskPriority
type SortKey = 'created' | 'priority' | 'due_date'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: PRIORITY_LABELS.high },
  { value: 'medium', label: PRIORITY_LABELS.medium },
  { value: 'low', label: PRIORITY_LABELS.low },
]

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Más recientes' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'due_date', label: 'Vencimiento' },
]

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

const SELECT_CLASS =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40'

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

const tasks = ref<Task[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filter = ref<StatusFilter>('all')
const priorityFilter = ref<PriorityFilter>('all')
const sort = ref<SortKey>('created')
const togglingIds = ref<Set<string>>(new Set())
const formOpen = ref(false)
const deleteTarget = ref<Task | null>(null)
const deleting = ref(false)
// Referencia para "vencida"; se refresca cada minuto.
const now = ref(Date.now())

let nowInterval: number | undefined

async function loadTasks() {
  error.value = null
  try {
    tasks.value = await getTasks()
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudieron cargar tus tareas.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  nowInterval = window.setInterval(() => {
    now.value = Date.now()
  }, 60_000)
  void loadTasks()
})

onBeforeUnmount(() => window.clearInterval(nowInterval))

// Se trae la lista completa una sola vez y se filtra en el cliente: así los
// contadores de cada pestaña están siempre al día sin pedidos extra.
const byPriority = computed(() =>
  priorityFilter.value === 'all'
    ? tasks.value
    : tasks.value.filter((t) => t.priority === priorityFilter.value),
)

const counts = computed<Record<StatusFilter, number>>(() => ({
  all: byPriority.value.length,
  pending: byPriority.value.filter((t) => t.status === 'pending').length,
  completed: byPriority.value.filter((t) => t.status === 'completed').length,
}))

const visibleTasks = computed(() =>
  sortTasks(
    filter.value === 'all'
      ? byPriority.value
      : byPriority.value.filter((t) => t.status === filter.value),
    sort.value,
  ),
)

function replaceTask(id: string, patch: (task: Task) => Task) {
  tasks.value = tasks.value.map((t) => (t.id === id ? patch(t) : t))
}

function setToggling(id: string, active: boolean) {
  const next = new Set(togglingIds.value)
  if (active) next.add(id)
  else next.delete(id)
  togglingIds.value = next
}

async function handleToggle(task: Task) {
  if (togglingIds.value.has(task.id)) return
  const previousStatus = task.status
  const nextStatus: TaskStatus = previousStatus === 'pending' ? 'completed' : 'pending'

  // Actualización optimista: la UI cambia al instante y se revierte si la API falla.
  error.value = null
  replaceTask(task.id, (t) => ({ ...t, status: nextStatus }))
  setToggling(task.id, true)
  try {
    const updated = await updateTask(task.id, { status: nextStatus })
    replaceTask(updated.id, () => updated)
  } catch (err) {
    replaceTask(task.id, (t) => ({ ...t, status: previousStatus }))
    error.value = extractErrorMessage(err, 'No se pudo actualizar la tarea.')
  } finally {
    setToggling(task.id, false)
  }
}

async function handleCreate(values: CreateTaskDTO) {
  const created = await createTask(values)
  tasks.value = [created, ...tasks.value]
  formOpen.value = false
}

async function handleConfirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  try {
    await deleteTask(target.id)
    tasks.value = tasks.value.filter((t) => t.id !== target.id)
    deleteTarget.value = null
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo eliminar la tarea.')
  } finally {
    deleting.value = false
  }
}

const emptyMessage = computed(() =>
  filter.value === 'pending'
    ? 'No tenés tareas pendientes. ¡Buen trabajo!'
    : filter.value === 'completed'
      ? 'Todavía no completaste ninguna tarea.'
      : priorityFilter.value !== 'all'
        ? 'No hay tareas con esa prioridad.'
        : 'No tenés tareas. Creá la primera con “+ Nueva tarea”.',
)
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Tareas</h1>
        <p class="mt-1 text-sm text-slate-500">
          Marcá una tarea para completarla; el cambio se guarda al instante.
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        @click="formOpen = true"
      >
        + Nueva tarea
      </button>
    </div>

    <div v-if="error" class="mt-6">
      <Alert variant="error">{{ error }}</Alert>
    </div>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-1 rounded-lg bg-slate-200/70 p-1" role="tablist">
        <button
          v-for="option in FILTERS"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="filter === option.value"
          :class="[
            'rounded-md px-3 py-1.5 text-sm font-medium transition',
            filter === option.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="filter = option.value"
        >
          {{ option.label }}
          <span class="ml-1.5 text-xs text-slate-400">{{ counts[option.value] }}</span>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-600">
          Prioridad
          <select v-model="priorityFilter" :class="SELECT_CLASS">
            <option v-for="option in PRIORITY_FILTERS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm text-slate-600">
          Ordenar por
          <select v-model="sort" :class="SELECT_CLASS">
            <option v-for="option in SORTS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div class="mt-4">
      <div v-if="loading" class="mt-16 flex justify-center">
        <Spinner svg-class="h-8 w-8 text-indigo-600" />
      </div>
      <TaskList
        v-else
        :tasks="visibleTasks"
        :toggling-ids="togglingIds"
        :empty-message="emptyMessage"
        :now="now"
        @toggle="(task) => void handleToggle(task)"
        @delete="(task) => (deleteTarget = task)"
      />
    </div>

    <TaskFormModal v-if="formOpen" :on-submit="handleCreate" @close="formOpen = false" />

    <ConfirmDialog
      v-if="deleteTarget"
      title="Eliminar tarea"
      :description="`¿Seguro que querés eliminar &quot;${deleteTarget.title}&quot;? Esta acción no se puede deshacer.`"
      :loading="deleting"
      @confirm="handleConfirmDelete"
      @cancel="deleteTarget = null"
    />
  </section>
</template>
