import type { ComputedRef, Ref } from 'vue'
import type { Router } from 'vue-router'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_UPDATE_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTimeBlockDTO, Task, TimeBlock, UpdateTimeBlockDTO } from '../types/productivity'

/** Bloque abierto en el editor: uno existente, o un tramo nuevo (`block: null`). */
export type EditorTarget = { block: TimeBlock | null; span?: BlockSpan }

/** Movimiento de un bloque a un tramo (en minutos del día visible). */
type Move = { block: TimeBlock; span: BlockSpan }

/** Estado reactivo del Cronograma. */
export type ScheduleState = {
  prefs: Ref<SchedulePrefs>
  day: Ref<Date>
  blocks: Ref<TimeBlock[]>
  tasks: Ref<Task[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  notice: Ref<string | null>
  busy: Ref<boolean>
  selectedTaskId: Ref<string | null>
  editor: Ref<EditorTarget | null>
  undo: Ref<UndoAction | null>
}

/** Estado más lo que las acciones necesitan derivado de él. */
export type ScheduleStore = ScheduleState & {
  tasksById: ComputedRef<Map<string, Task>>
  nowMinute: ComputedRef<number | null>
  router: Router
}

// ── Navegación y preferencias ──

export function setPrefs(store: ScheduleStore, patch: Partial<SchedulePrefs>) {
  store.prefs.value = { ...store.prefs.value, ...patch }
  schedule.saveSchedulePrefs(store.prefs.value)
}

export function changeDay(store: ScheduleStore, next: Date) {
  if (next.getTime() !== store.day.value.getTime()) store.day.value = next
}

export function openDay(store: ScheduleStore, next: Date) {
  changeDay(store, schedule.startOfDay(next))
  setPrefs(store, { mode: 'day' })
}

// ── Mutaciones con "Deshacer" ──

function fail(store: ScheduleStore, err: unknown, message: string) {
  store.error.value = extractErrorMessage(err, message)
}

async function createMany(store: ScheduleStore, payloads: CreateTimeBlockDTO[]): Promise<TimeBlock[]> {
  const created: TimeBlock[] = []
  for (const payload of payloads) created.push(await api.createTimeBlock(payload))
  store.blocks.value = created.reduce(schedule.addBlock, store.blocks.value)
  return created
}

async function deleteMany(store: ScheduleStore, ids: string[]) {
  await Promise.all(ids.map((id) => api.deleteTimeBlock(id)))
  store.blocks.value = store.blocks.value.filter((block) => !ids.includes(block.id))
}

function offerUndoCreate(store: ScheduleStore, created: TimeBlock[], message: string) {
  if (created.length === 0) return
  store.undo.value = { message, undo: () => deleteMany(store, created.map((block) => block.id)) }
}

type Update = { block: TimeBlock; patch: UpdateTimeBlockDTO }

const replaceAll = (blocks: TimeBlock[], updated: TimeBlock[]) => updated.reduce(schedule.replaceBlock, blocks)

async function patchMany(store: ScheduleStore, updates: Update[]) {
  store.blocks.value = replaceAll(store.blocks.value, updates.map(({ block, patch }) => ({ ...block, ...patch }) as TimeBlock))
  try {
    const saved = await Promise.all(updates.map(({ block, patch }) => api.updateTimeBlock(block.id, patch)))
    store.blocks.value = replaceAll(store.blocks.value, saved)
  } catch (err) {
    store.blocks.value = replaceAll(store.blocks.value, updates.map(({ block }) => block))
    throw err
  }
}

/** Movimientos inversos de `forward`: cada bloque (ya movido) vuelve a su tramo original. */
function backwardMoves(moves: Move[], forward: Update[]): Update[] {
  return moves.map(({ block }) => ({
    block: { ...block, ...forward.find((f) => f.block.id === block.id)?.patch } as TimeBlock,
    patch: { start_time: block.start_time, end_time: block.end_time },
  }))
}

/** Mueve/redimensiona bloques; "Deshacer" los devuelve a su tramo anterior. */
async function applyMoves(store: ScheduleStore, moves: Move[], message: string) {
  if (moves.length === 0) return
  store.error.value = null
  const forward = moves.map(({ block, span }) => ({ block, patch: schedule.spanToTimes(span, store.day.value) }))
  try {
    await patchMany(store, forward)
    store.undo.value = { message, undo: () => patchMany(store, backwardMoves(moves, forward)) }
  } catch (err) {
    fail(store, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

export const commitSpan = (store: ScheduleStore, block: TimeBlock, span: BlockSpan) =>
  applyMoves(store, [{ block, span }], 'Bloque actualizado.')

export async function placeTask(store: ScheduleStore, taskId: string, minute: number) {
  const task = store.tasksById.value.get(taskId)
  if (!task) return
  store.error.value = null
  store.selectedTaskId.value = null
  try {
    offerUndoCreate(store, await createMany(store, [schedule.blockFromTask(task, store.day.value, minute)]), 'Tarea agendada.')
  } catch (err) {
    fail(store, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

export async function remove(store: ScheduleStore, block: TimeBlock) {
  store.error.value = null
  store.editor.value = null
  store.blocks.value = schedule.removeBlock(store.blocks.value, block.id)
  try {
    await api.deleteTimeBlock(block.id)
    const recreate = async () => void (await createMany(store, [schedule.recreatePayload(block)]))
    store.undo.value = { message: `Se eliminó «${block.title}».`, undo: recreate }
  } catch (err) {
    store.blocks.value = schedule.addBlock(store.blocks.value, block)
    fail(store, err, schedule.SCHEDULE_DELETE_ERROR)
  }
}

export async function runUndo(store: ScheduleStore) {
  const action = store.undo.value
  store.undo.value = null
  if (!action) return
  try {
    await action.undo()
  } catch (err) {
    fail(store, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

// ── Planificación inteligente ──

/** Corre `job` marcando la pantalla como ocupada; un error muestra `errorMessage`. */
async function runBusy(store: ScheduleStore, errorMessage: string, job: () => Promise<void>) {
  try {
    await job()
  } catch (err) {
    fail(store, err, errorMessage)
  } finally {
    store.busy.value = false
  }
}

function startBusy(store: ScheduleStore) {
  store.error.value = null
  store.busy.value = true
}

export function autoScheduleDay(store: ScheduleStore) {
  startBusy(store)
  const freeWindow = schedule.planningWindow(store.prefs.value.workHours, store.nowMinute.value)
  const { planned, skipped } = schedule.autoSchedule(store.tasks.value, store.blocks.value, store.day.value, freeWindow)
  return runBusy(store, schedule.AUTO_SCHEDULE_ERROR, async () => {
    offerUndoCreate(store, await createMany(store, planned), 'Agendado automático aplicado.')
    store.notice.value = schedule.autoScheduleMessage(planned.length, skipped.length)
  })
}

const copiedMessage = (count: number) =>
  count === 0 ? 'El día anterior no tiene bloques para copiar.' : `Se copiaron ${count} bloques del día anterior.`

export function copyPreviousDay(store: ScheduleStore) {
  startBusy(store)
  const previous = schedule.addDays(store.day.value, -1)
  return runBusy(store, schedule.COPY_DAY_ERROR, async () => {
    const source = await api.getSchedule(schedule.dayRange(previous))
    const created = await createMany(store, schedule.copyBlocksToDay(source, previous, store.day.value))
    offerUndoCreate(store, created, 'Se copió el día anterior.')
    store.notice.value = copiedMessage(created.length)
  })
}

export async function moveToNextSlot(store: ScheduleStore, block: TimeBlock) {
  const slot = schedule.nextFreeSlotFor(block, store.blocks.value, store.day.value)
  store.editor.value = null
  if (slot) await applyMoves(store, [{ block, span: slot }], `«${block.title}» se movió al siguiente hueco libre.`)
}

export async function pushFollowing(store: ScheduleStore, block: TimeBlock) {
  store.editor.value = null
  await applyMoves(store, schedule.pushFollowing(block, store.blocks.value, store.day.value), 'Se corrieron los bloques siguientes.')
}

// ── Editor ──

async function completeLinkedTask(store: ScheduleStore, taskId: string) {
  try {
    const task = await api.updateTask(taskId, { status: 'completed' })
    store.tasks.value = store.tasks.value.map((candidate) => (candidate.id === task.id ? task : candidate))
  } catch (err) {
    fail(store, err, TASK_UPDATE_ERROR)
  }
}

async function updateFromEditor(store: ScheduleStore, block: TimeBlock, values: BlockFormValues, base: Date) {
  const updated = await api.updateTimeBlock(block.id, schedule.buildUpdateBlockPayload(values, base))
  store.blocks.value = schedule.replaceBlock(store.blocks.value, updated)
  if (schedule.shouldCompleteTask(block, values, store.tasksById.value) && block.task_id) {
    await completeLinkedTask(store, block.task_id)
  }
}

export async function saveEditor(store: ScheduleStore, values: BlockFormValues) {
  const target = store.editor.value
  if (!target) return
  const base = schedule.formBaseDay(target.block, store.day.value)
  if (target.block) {
    await updateFromEditor(store, target.block, values, base)
  } else {
    offerUndoCreate(store, await createMany(store, [schedule.buildCreateBlockPayload(values, base)]), 'Bloque creado.')
  }
  store.editor.value = null
}

/** "Enfocar": el Pomodoro imputará sus bloques de trabajo a este bloque. */
export function focus(store: ScheduleStore, block: TimeBlock) {
  schedule.saveFocusTarget(schedule.focusTargetFor(block))
  void store.router.push('/pomodoro')
}
