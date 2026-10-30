import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_LOAD_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { Task, TimeBlock } from '../types/productivity'
import * as actions from './scheduleActions'
import type { EditorTarget, ScheduleState, ScheduleStore } from './scheduleActions'
import { useNow } from './useNow'

export type { EditorTarget } from './scheduleActions'

function useScheduleState(): ScheduleState {
  return {
    prefs: ref<SchedulePrefs>(schedule.loadSchedulePrefs()),
    day: ref(schedule.startOfDay(new Date())),
    blocks: ref<TimeBlock[]>([]),
    tasks: ref<Task[]>([]),
    loading: ref(true),
    error: ref<string | null>(null),
    notice: ref<string | null>(null),
    busy: ref(false),
    selectedTaskId: ref<string | null>(null),
    editor: ref<EditorTarget | null>(null),
    undo: ref<UndoAction | null>(null),
  }
}

const visibleRange = ({ prefs, day }: ScheduleState) =>
  prefs.value.mode === 'week' ? schedule.weekRange(day.value) : schedule.dayRange(day.value)

/** Bloques visibles; solo la última petición actualiza la grilla (navegación rápida entre días). */
function useBlocksLoader(state: ScheduleState) {
  let request = 0
  async function load() {
    const current = ++request
    const isCurrent = () => current === request
    state.loading.value = true
    state.error.value = null
    try {
      const rows = await api.getSchedule(visibleRange(state))
      if (isCurrent()) state.blocks.value = schedule.sortBlocks(rows)
    } catch (err) {
      if (isCurrent()) state.error.value = extractErrorMessage(err, schedule.SCHEDULE_LOAD_ERROR)
    } finally {
      if (isCurrent()) state.loading.value = false
    }
  }
  watch([state.day, () => state.prefs.value.mode], load, { immediate: true })
}

function useTasksLoader({ tasks, error }: ScheduleState) {
  onMounted(async () => {
    try {
      tasks.value = await api.getTasks()
    } catch (err) {
      error.value = extractErrorMessage(err, TASK_LOAD_ERROR)
    }
  })
}

/** El aviso "Deshacer" se descarta solo. */
function useUndoExpiry(undo: Ref<UndoAction | null>) {
  let undoTimer: number | undefined
  watch(undo, (action) => {
    window.clearTimeout(undoTimer)
    if (action) undoTimer = window.setTimeout(() => (undo.value = null), schedule.UNDO_TIMEOUT_MS)
  })
  onBeforeUnmount(() => window.clearTimeout(undoTimer))
}

function useDerived(state: ScheduleState, now: Ref<number>) {
  const { blocks, tasks, day, prefs } = state
  return {
    conflicts: computed(() => schedule.findConflicts(blocks.value)),
    layout: computed(() => schedule.assignLanes(blocks.value)),
    tasksById: computed(() => new Map(tasks.value.map((task) => [task.id, task]))),
    pending: computed(() => schedule.pendingTasks(tasks.value)),
    scheduledIds: computed(() => schedule.scheduledTaskIds(blocks.value)),
    summary: computed(() => schedule.daySummary(blocks.value)),
    nowMinute: computed(() => schedule.nowMinute(now.value, day.value)),
    view: computed(() => schedule.viewWindow(prefs.value.zoom, prefs.value.workHours)),
  }
}

type Derived = ReturnType<typeof useDerived>

/** Día/semana visible, preferencias y datos para dibujar la pantalla. */
function viewState(store: ScheduleStore, now: Ref<number>, derived: Derived) {
  const step = computed(() => (store.prefs.value.mode === 'week' ? 7 : 1))
  return {
    prefs: store.prefs,
    setPrefs: (patch: Partial<SchedulePrefs>) => actions.setPrefs(store, patch),
    view: derived.view,
    day: store.day,
    isToday: computed(() => schedule.isSameDay(store.day.value, new Date(now.value))),
    goToDay: (offset: number) => actions.changeDay(store, schedule.addDays(store.day.value, offset * step.value)),
    goToToday: () => actions.changeDay(store, schedule.startOfDay(new Date())),
    openDay: (next: Date) => actions.openDay(store, next),
    blocks: store.blocks,
    pending: derived.pending,
    tasksById: derived.tasksById,
    scheduledIds: derived.scheduledIds,
    conflicts: derived.conflicts,
    layout: derived.layout,
    summary: derived.summary,
    nowMinute: derived.nowMinute,
  }
}

/** Estados de carga, avisos, selección y editor. */
function panelState(store: ScheduleStore) {
  return {
    loading: store.loading,
    busy: store.busy,
    error: store.error,
    notice: store.notice,
    dismissNotice: () => (store.notice.value = null),
    selectedTaskId: store.selectedTaskId,
    selectTask: (id: string | null) => {
      store.selectedTaskId.value = store.selectedTaskId.value === id ? null : id
    },
    editor: store.editor,
    openEditor: (target: EditorTarget) => (store.editor.value = target),
    closeEditor: () => (store.editor.value = null),
    saveEditor: (values: BlockFormValues) => actions.saveEditor(store, values),
    undo: store.undo,
    runUndo: () => actions.runUndo(store),
    dismissUndo: () => (store.undo.value = null),
  }
}

/** Acciones sobre los bloques y planificación inteligente. */
function blockCommands(store: ScheduleStore) {
  return {
    placeTask: (taskId: string, minute: number) => actions.placeTask(store, taskId, minute),
    commitSpan: (block: TimeBlock, span: BlockSpan) => actions.commitSpan(store, block, span),
    remove: (block: TimeBlock) => actions.remove(store, block),
    focus: (block: TimeBlock) => actions.focus(store, block),
    autoScheduleDay: () => actions.autoScheduleDay(store),
    copyPreviousDay: () => actions.copyPreviousDay(store),
    moveToNextSlot: (block: TimeBlock) => actions.moveToNextSlot(store, block),
    pushFollowing: (block: TimeBlock) => actions.pushFollowing(store, block),
  }
}

/**
 * Estado del Cronograma: día/semana visible, preferencias, bloques, tareas, editor, aviso
 * "Deshacer" y acciones de planificación inteligente (todas con actualización optimista).
 */
export function useSchedule() {
  const router = useRouter()
  const state = useScheduleState()
  const now = useNow(30_000)
  useBlocksLoader(state)
  useTasksLoader(state)
  useUndoExpiry(state.undo)
  const derived = useDerived(state, now)
  const store: ScheduleStore = { ...state, tasksById: derived.tasksById, nowMinute: derived.nowMinute, router }
  return { ...viewState(store, now, derived), ...panelState(store), ...blockCommands(store) }
}

/** Estado y acciones del Cronograma (lo que reciben las piezas de la pantalla). */
export type ScheduleApi = ReturnType<typeof useSchedule>
