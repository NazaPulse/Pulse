import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_LOAD_ERROR, TASK_UPDATE_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTimeBlockDTO, Task, TimeBlock, UpdateTimeBlockDTO } from '../types/productivity'
import { useNow } from './useNow'

/** Bloque abierto en el editor: uno existente, o un tramo nuevo (`block: null`). */
export type EditorTarget = { block: TimeBlock | null; span?: BlockSpan }

/** Movimiento de un bloque a un tramo (en minutos del día visible). */
type Move = { block: TimeBlock; span: BlockSpan }

/**
 * Estado del Cronograma: día/semana visible, preferencias, bloques, tareas, editor, aviso
 * "Deshacer" y acciones de planificación inteligente (todas con actualización optimista).
 */
export function useSchedule() {
  const router = useRouter()
  const prefs = ref<SchedulePrefs>(schedule.loadSchedulePrefs())
  const day = ref(schedule.startOfDay(new Date()))
  const blocks = ref<TimeBlock[]>([])
  const tasks = ref<Task[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const notice = ref<string | null>(null)
  const busy = ref(false)
  const selectedTaskId = ref<string | null>(null)
  const editor = ref<EditorTarget | null>(null)
  const undo = ref<UndoAction | null>(null)
  const now = useNow(30_000)

  // Solo la última petición actualiza la grilla (navegación rápida entre días).
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    error.value = null
    const range = prefs.value.mode === 'week' ? schedule.weekRange(day.value) : schedule.dayRange(day.value)
    try {
      const rows = await api.getSchedule(range)
      if (current === request) blocks.value = schedule.sortBlocks(rows)
    } catch (err) {
      if (current === request) error.value = extractErrorMessage(err, schedule.SCHEDULE_LOAD_ERROR)
    } finally {
      if (current === request) loading.value = false
    }
  }

  watch([day, () => prefs.value.mode], load, { immediate: true })

  onMounted(async () => {
    try {
      tasks.value = await api.getTasks()
    } catch (err) {
      error.value = extractErrorMessage(err, TASK_LOAD_ERROR)
    }
  })

  // El aviso "Deshacer" se descarta solo.
  let undoTimer: number | undefined
  watch(undo, (action) => {
    window.clearTimeout(undoTimer)
    if (action) undoTimer = window.setTimeout(() => (undo.value = null), schedule.UNDO_TIMEOUT_MS)
  })
  onBeforeUnmount(() => window.clearTimeout(undoTimer))

  const conflicts = computed(() => schedule.findConflicts(blocks.value))
  const layout = computed(() => schedule.assignLanes(blocks.value))
  const tasksById = computed(() => new Map(tasks.value.map((task) => [task.id, task])))
  const pending = computed(() => schedule.pendingTasks(tasks.value))
  const scheduledIds = computed(() => schedule.scheduledTaskIds(blocks.value))
  const summary = computed(() => schedule.daySummary(blocks.value))
  const nowMinute = computed(() => schedule.nowMinute(now.value, day.value))
  const view = computed(() => schedule.viewWindow(prefs.value.zoom, prefs.value.workHours))

  // ── Navegación y preferencias ──

  function setPrefs(patch: Partial<SchedulePrefs>) {
    prefs.value = { ...prefs.value, ...patch }
    schedule.saveSchedulePrefs(prefs.value)
  }

  function changeDay(next: Date) {
    if (next.getTime() !== day.value.getTime()) day.value = next
  }

  function openDay(next: Date) {
    changeDay(schedule.startOfDay(next))
    setPrefs({ mode: 'day' })
  }

  // ── Mutaciones con "Deshacer" ──

  function fail(err: unknown, message: string) {
    error.value = extractErrorMessage(err, message)
  }

  async function createMany(payloads: CreateTimeBlockDTO[]): Promise<TimeBlock[]> {
    const created: TimeBlock[] = []
    for (const payload of payloads) created.push(await api.createTimeBlock(payload))
    blocks.value = created.reduce(schedule.addBlock, blocks.value)
    return created
  }

  async function deleteMany(ids: string[]) {
    await Promise.all(ids.map((id) => api.deleteTimeBlock(id)))
    blocks.value = blocks.value.filter((block) => !ids.includes(block.id))
  }

  function offerUndoCreate(created: TimeBlock[], message: string) {
    if (created.length === 0) return
    undo.value = { message, undo: () => deleteMany(created.map((block) => block.id)) }
  }

  async function patchMany(updates: { block: TimeBlock; patch: UpdateTimeBlockDTO }[]) {
    blocks.value = updates.reduce((acc, { block, patch }) => schedule.replaceBlock(acc, { ...block, ...patch } as TimeBlock), blocks.value)
    try {
      const saved = await Promise.all(updates.map(({ block, patch }) => api.updateTimeBlock(block.id, patch)))
      blocks.value = saved.reduce(schedule.replaceBlock, blocks.value)
    } catch (err) {
      blocks.value = updates.reduce((acc, { block }) => schedule.replaceBlock(acc, block), blocks.value)
      throw err
    }
  }

  /** Mueve/redimensiona bloques; "Deshacer" los devuelve a su tramo anterior. */
  async function applyMoves(moves: Move[], message: string) {
    if (moves.length === 0) return
    error.value = null
    const forward = moves.map(({ block, span }) => ({ block, patch: schedule.spanToTimes(span, day.value) }))
    try {
      await patchMany(forward)
      undo.value = {
        message,
        undo: () =>
          patchMany(
            moves.map(({ block }) => ({
              block: { ...block, ...forward.find((f) => f.block.id === block.id)?.patch } as TimeBlock,
              patch: { start_time: block.start_time, end_time: block.end_time },
            })),
          ),
      }
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  const commitSpan = (block: TimeBlock, span: BlockSpan) => applyMoves([{ block, span }], 'Bloque actualizado.')

  async function placeTask(taskId: string, minute: number) {
    const task = tasksById.value.get(taskId)
    if (!task) return
    error.value = null
    selectedTaskId.value = null
    try {
      offerUndoCreate(await createMany([schedule.blockFromTask(task, day.value, minute)]), 'Tarea agendada.')
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  async function remove(block: TimeBlock) {
    error.value = null
    editor.value = null
    blocks.value = schedule.removeBlock(blocks.value, block.id)
    try {
      await api.deleteTimeBlock(block.id)
      undo.value = {
        message: `Se eliminó «${block.title}».`,
        undo: async () => void (await createMany([schedule.recreatePayload(block)])),
      }
    } catch (err) {
      blocks.value = schedule.addBlock(blocks.value, block)
      fail(err, schedule.SCHEDULE_DELETE_ERROR)
    }
  }

  async function runUndo() {
    const action = undo.value
    undo.value = null
    if (!action) return
    try {
      await action.undo()
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  // ── Planificación inteligente ──

  async function autoScheduleDay() {
    error.value = null
    busy.value = true
    const { planned, skipped } = schedule.autoSchedule(
      tasks.value,
      blocks.value,
      day.value,
      prefs.value.workHours,
      nowMinute.value,
    )
    try {
      offerUndoCreate(await createMany(planned), 'Agendado automático aplicado.')
      notice.value = schedule.autoScheduleMessage(planned.length, skipped.length)
    } catch (err) {
      fail(err, schedule.AUTO_SCHEDULE_ERROR)
    } finally {
      busy.value = false
    }
  }

  async function copyPreviousDay() {
    error.value = null
    busy.value = true
    const previous = schedule.addDays(day.value, -1)
    try {
      const source = await api.getSchedule(schedule.dayRange(previous))
      const created = await createMany(schedule.copyBlocksToDay(source, previous, day.value))
      offerUndoCreate(created, 'Se copió el día anterior.')
      notice.value =
        created.length === 0
          ? 'El día anterior no tiene bloques para copiar.'
          : `Se copiaron ${created.length} bloques del día anterior.`
    } catch (err) {
      fail(err, schedule.COPY_DAY_ERROR)
    } finally {
      busy.value = false
    }
  }

  async function moveToNextSlot(block: TimeBlock) {
    const slot = schedule.nextFreeSlotFor(block, blocks.value, day.value)
    editor.value = null
    if (slot) await applyMoves([{ block, span: slot }], `«${block.title}» se movió al siguiente hueco libre.`)
  }

  async function pushFollowing(block: TimeBlock) {
    editor.value = null
    await applyMoves(schedule.pushFollowing(block, blocks.value, day.value), 'Se corrieron los bloques siguientes.')
  }

  // ── Editor ──

  async function saveEditor(values: BlockFormValues) {
    const target = editor.value
    if (!target) return
    const base = schedule.formBaseDay(target.block, day.value)
    if (!target.block) {
      offerUndoCreate(await createMany([schedule.buildCreateBlockPayload(values, base)]), 'Bloque creado.')
      editor.value = null
      return
    }
    const block = target.block
    const updated = await api.updateTimeBlock(block.id, schedule.buildUpdateBlockPayload(values, base))
    blocks.value = schedule.replaceBlock(blocks.value, updated)
    if (schedule.shouldCompleteTask(block, values, tasksById.value) && block.task_id) {
      try {
        const task = await api.updateTask(block.task_id, { status: 'completed' })
        tasks.value = tasks.value.map((candidate) => (candidate.id === task.id ? task : candidate))
      } catch (err) {
        fail(err, TASK_UPDATE_ERROR)
      }
    }
    editor.value = null
  }

  /** "Enfocar": el Pomodoro imputará sus bloques de trabajo a este bloque. */
  function focus(block: TimeBlock) {
    schedule.saveFocusTarget(schedule.focusTargetFor(block))
    void router.push('/pomodoro')
  }

  const step = computed(() => (prefs.value.mode === 'week' ? 7 : 1))

  return {
    prefs,
    setPrefs,
    view,
    day,
    isToday: computed(() => schedule.isSameDay(day.value, new Date(now.value))),
    goToDay: (offset: number) => changeDay(schedule.addDays(day.value, offset * step.value)),
    goToToday: () => changeDay(schedule.startOfDay(new Date())),
    openDay,
    blocks,
    pending,
    tasksById,
    scheduledIds,
    conflicts,
    layout,
    summary,
    nowMinute,
    loading,
    busy,
    error,
    notice,
    dismissNotice: () => (notice.value = null),
    selectedTaskId,
    selectTask: (id: string | null) => {
      selectedTaskId.value = selectedTaskId.value === id ? null : id
    },
    editor,
    openEditor: (target: EditorTarget) => (editor.value = target),
    closeEditor: () => (editor.value = null),
    saveEditor,
    undo,
    runUndo,
    dismissUndo: () => (undo.value = null),
    placeTask,
    commitSpan,
    remove,
    focus,
    autoScheduleDay,
    copyPreviousDay,
    moveToNextSlot,
    pushFollowing,
  }
}
