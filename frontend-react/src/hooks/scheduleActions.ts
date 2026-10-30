import type { Dispatch, SetStateAction } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_UPDATE_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTimeBlockDTO, Task, TimeBlock, UpdateTimeBlockDTO } from '../types/productivity'

/** Bloque abierto en el editor: uno existente, o un tramo nuevo (`block: null`). */
export type EditorTarget = { block: TimeBlock | null; span?: BlockSpan }

/** Movimiento de un bloque a un tramo (en minutos del día visible). */
type Move = { block: TimeBlock; span: BlockSpan }

type Setter<T> = Dispatch<SetStateAction<T>>

/** Estado del Cronograma (valores y setters de `useState`). */
export type ScheduleStore = {
  prefs: SchedulePrefs
  setPrefsState: Setter<SchedulePrefs>
  day: Date
  setDay: Setter<Date>
  blocks: TimeBlock[]
  setBlocks: Setter<TimeBlock[]>
  tasks: Task[]
  setTasks: Setter<Task[]>
  loading: boolean
  setLoading: Setter<boolean>
  error: string | null
  setError: Setter<string | null>
  notice: string | null
  setNotice: Setter<string | null>
  busy: boolean
  setBusy: Setter<boolean>
  selectedTaskId: string | null
  setSelectedTaskId: Setter<string | null>
  editor: EditorTarget | null
  setEditor: Setter<EditorTarget | null>
  undo: UndoAction | null
  setUndo: Setter<UndoAction | null>
}

/** Estado del render actual más lo que las acciones necesitan derivado de él. */
export type ScheduleContext = ScheduleStore & {
  tasksById: ReadonlyMap<string, Task>
  nowMinute: number | null
  navigate: (path: string) => void
}

// ── Navegación y preferencias ──

export function setPrefs(ctx: ScheduleContext, patch: Partial<SchedulePrefs>) {
  const next = { ...ctx.prefs, ...patch }
  schedule.saveSchedulePrefs(next)
  if (next.mode !== ctx.prefs.mode) ctx.setLoading(true)
  ctx.setPrefsState(next)
}

// El spinner y el error se reinician al cambiar de día; el efecto solo trae los datos.
export function changeDay(ctx: ScheduleContext, next: Date) {
  if (next.getTime() === ctx.day.getTime()) return
  ctx.setLoading(true)
  ctx.setError(null)
  ctx.setDay(next)
}

export function openDay(ctx: ScheduleContext, next: Date) {
  changeDay(ctx, schedule.startOfDay(next))
  setPrefs(ctx, { mode: 'day' })
}

// ── Mutaciones con "Deshacer" ──

function fail(ctx: ScheduleContext, err: unknown, message: string) {
  ctx.setError(extractErrorMessage(err, message))
}

async function createMany(ctx: ScheduleContext, payloads: CreateTimeBlockDTO[]): Promise<TimeBlock[]> {
  const created: TimeBlock[] = []
  for (const payload of payloads) created.push(await api.createTimeBlock(payload))
  ctx.setBlocks((prev) => created.reduce(schedule.addBlock, prev))
  return created
}

async function deleteMany(ctx: ScheduleContext, ids: string[]) {
  await Promise.all(ids.map((id) => api.deleteTimeBlock(id)))
  ctx.setBlocks((prev) => prev.filter((block) => !ids.includes(block.id)))
}

function offerUndoCreate(ctx: ScheduleContext, created: TimeBlock[], message: string) {
  if (created.length === 0) return
  ctx.setUndo({
    message,
    undo: () =>
      deleteMany(
        ctx,
        created.map((block) => block.id),
      ),
  })
}

type Update = { block: TimeBlock; patch: UpdateTimeBlockDTO }

const replaceAll = (blocks: TimeBlock[], updated: TimeBlock[]) => updated.reduce(schedule.replaceBlock, blocks)

async function patchMany(ctx: ScheduleContext, updates: Update[]) {
  ctx.setBlocks((prev) =>
    replaceAll(
      prev,
      updates.map(({ block, patch }) => ({ ...block, ...patch }) as TimeBlock),
    ),
  )
  try {
    const saved = await Promise.all(updates.map(({ block, patch }) => api.updateTimeBlock(block.id, patch)))
    ctx.setBlocks((prev) => replaceAll(prev, saved))
  } catch (err) {
    ctx.setBlocks((prev) =>
      replaceAll(
        prev,
        updates.map(({ block }) => block),
      ),
    )
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
async function applyMoves(ctx: ScheduleContext, moves: Move[], message: string) {
  if (moves.length === 0) return
  ctx.setError(null)
  const forward = moves.map(({ block, span }) => ({ block, patch: schedule.spanToTimes(span, ctx.day) }))
  try {
    await patchMany(ctx, forward)
    ctx.setUndo({ message, undo: () => patchMany(ctx, backwardMoves(moves, forward)) })
  } catch (err) {
    fail(ctx, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

export const commitSpan = (ctx: ScheduleContext, block: TimeBlock, span: BlockSpan) =>
  applyMoves(ctx, [{ block, span }], 'Bloque actualizado.')

export async function placeTask(ctx: ScheduleContext, taskId: string, minute: number) {
  const task = ctx.tasksById.get(taskId)
  if (!task) return
  ctx.setError(null)
  ctx.setSelectedTaskId(null)
  try {
    offerUndoCreate(ctx, await createMany(ctx, [schedule.blockFromTask(task, ctx.day, minute)]), 'Tarea agendada.')
  } catch (err) {
    fail(ctx, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

export async function remove(ctx: ScheduleContext, block: TimeBlock) {
  ctx.setError(null)
  ctx.setEditor(null)
  ctx.setBlocks((prev) => schedule.removeBlock(prev, block.id))
  try {
    await api.deleteTimeBlock(block.id)
    const recreate = async () => void (await createMany(ctx, [schedule.recreatePayload(block)]))
    ctx.setUndo({ message: `Se eliminó «${block.title}».`, undo: recreate })
  } catch (err) {
    ctx.setBlocks((prev) => schedule.addBlock(prev, block))
    fail(ctx, err, schedule.SCHEDULE_DELETE_ERROR)
  }
}

export async function runUndo(ctx: ScheduleContext) {
  const action = ctx.undo
  ctx.setUndo(null)
  if (!action) return
  try {
    await action.undo()
  } catch (err) {
    fail(ctx, err, schedule.SCHEDULE_SAVE_ERROR)
  }
}

// ── Planificación inteligente ──

/** Corre `job` marcando la pantalla como ocupada; un error muestra `errorMessage`. */
async function runBusy(ctx: ScheduleContext, errorMessage: string, job: () => Promise<void>) {
  ctx.setError(null)
  ctx.setBusy(true)
  try {
    await job()
  } catch (err) {
    fail(ctx, err, errorMessage)
  } finally {
    ctx.setBusy(false)
  }
}

export function autoScheduleDay(ctx: ScheduleContext) {
  const freeWindow = schedule.planningWindow(ctx.prefs.workHours, ctx.nowMinute)
  const { planned, skipped } = schedule.autoSchedule(ctx.tasks, ctx.blocks, ctx.day, freeWindow)
  return runBusy(ctx, schedule.AUTO_SCHEDULE_ERROR, async () => {
    offerUndoCreate(ctx, await createMany(ctx, planned), 'Agendado automático aplicado.')
    ctx.setNotice(schedule.autoScheduleMessage(planned.length, skipped.length))
  })
}

const copiedMessage = (count: number) =>
  count === 0 ? 'El día anterior no tiene bloques para copiar.' : `Se copiaron ${count} bloques del día anterior.`

export function copyPreviousDay(ctx: ScheduleContext) {
  const previous = schedule.addDays(ctx.day, -1)
  return runBusy(ctx, schedule.COPY_DAY_ERROR, async () => {
    const source = await api.getSchedule(schedule.dayRange(previous))
    const created = await createMany(ctx, schedule.copyBlocksToDay(source, previous, ctx.day))
    offerUndoCreate(ctx, created, 'Se copió el día anterior.')
    ctx.setNotice(copiedMessage(created.length))
  })
}

export async function moveToNextSlot(ctx: ScheduleContext, block: TimeBlock) {
  const slot = schedule.nextFreeSlotFor(block, ctx.blocks, ctx.day)
  ctx.setEditor(null)
  if (slot) await applyMoves(ctx, [{ block, span: slot }], `«${block.title}» se movió al siguiente hueco libre.`)
}

export async function pushFollowing(ctx: ScheduleContext, block: TimeBlock) {
  ctx.setEditor(null)
  await applyMoves(ctx, schedule.pushFollowing(block, ctx.blocks, ctx.day), 'Se corrieron los bloques siguientes.')
}

// ── Editor ──

async function completeLinkedTask(ctx: ScheduleContext, taskId: string) {
  try {
    const task = await api.updateTask(taskId, { status: 'completed' })
    ctx.setTasks((prev) => prev.map((candidate) => (candidate.id === task.id ? task : candidate)))
  } catch (err) {
    fail(ctx, err, TASK_UPDATE_ERROR)
  }
}

async function updateFromEditor(ctx: ScheduleContext, block: TimeBlock, values: BlockFormValues, base: Date) {
  const updated = await api.updateTimeBlock(block.id, schedule.buildUpdateBlockPayload(values, base))
  ctx.setBlocks((prev) => schedule.replaceBlock(prev, updated))
  if (schedule.shouldCompleteTask(block, values, ctx.tasksById) && block.task_id) {
    await completeLinkedTask(ctx, block.task_id)
  }
}

export async function saveEditor(ctx: ScheduleContext, values: BlockFormValues) {
  const target = ctx.editor
  if (!target) return
  const base = schedule.formBaseDay(target.block, ctx.day)
  if (target.block) {
    await updateFromEditor(ctx, target.block, values, base)
  } else {
    offerUndoCreate(ctx, await createMany(ctx, [schedule.buildCreateBlockPayload(values, base)]), 'Bloque creado.')
  }
  ctx.setEditor(null)
}

/** "Enfocar": el Pomodoro imputará sus bloques de trabajo a este bloque. */
export function focus(ctx: ScheduleContext, block: TimeBlock) {
  schedule.saveFocusTarget(schedule.focusTargetFor(block))
  ctx.navigate('/pomodoro')
}
