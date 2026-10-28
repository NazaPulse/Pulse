import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_LOAD_ERROR, TASK_UPDATE_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { CreateTimeBlockDTO, Task, TimeBlock, UpdateTimeBlockDTO } from '../types/productivity'
import { useNow } from './useNow'

const NO_BLOCKS: TimeBlock[] = []
const NO_TASKS: Task[] = []

/** Bloque abierto en el editor: uno existente, o un tramo nuevo (`block: null`). */
export type EditorTarget = { block: TimeBlock | null; span?: BlockSpan }

/** Movimiento de un bloque a un tramo (en minutos del día visible). */
type Move = { block: TimeBlock; span: BlockSpan }

/**
 * Estado del Cronograma: día/semana visible, preferencias, bloques, tareas, editor, aviso
 * "Deshacer" y acciones de planificación inteligente (todas con actualización optimista).
 */
export function useSchedule() {
  const navigate = useNavigate()
  const [prefs, setPrefsState] = useState<SchedulePrefs>(() => schedule.loadSchedulePrefs())
  const [day, setDay] = useState(() => schedule.startOfDay(new Date()))
  const [blocks, setBlocks] = useState<TimeBlock[]>(NO_BLOCKS)
  const [tasks, setTasks] = useState<Task[]>(NO_TASKS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [undo, setUndo] = useState<UndoAction | null>(null)
  const now = useNow(30_000)

  useEffect(() => {
    let cancelled = false
    const range = prefs.mode === 'week' ? schedule.weekRange(day) : schedule.dayRange(day)
    api
      .getSchedule(range)
      .then((rows) => !cancelled && setBlocks(schedule.sortBlocks(rows)))
      .catch((err) => !cancelled && setError(extractErrorMessage(err, schedule.SCHEDULE_LOAD_ERROR)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [day, prefs.mode])

  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(extractErrorMessage(err, TASK_LOAD_ERROR)))
  }, [])

  // El aviso "Deshacer" se descarta solo.
  useEffect(() => {
    if (!undo) return
    const id = window.setTimeout(() => setUndo(null), schedule.UNDO_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [undo])

  const conflicts = useMemo(() => schedule.findConflicts(blocks), [blocks])
  const layout = useMemo(() => schedule.assignLanes(blocks), [blocks])
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const pending = useMemo(() => schedule.pendingTasks(tasks), [tasks])
  const scheduledIds = useMemo(() => schedule.scheduledTaskIds(blocks), [blocks])
  const summary = useMemo(() => schedule.daySummary(blocks), [blocks])
  const nowMinute = schedule.nowMinute(now, day)

  // ── Navegación y preferencias ──

  function setPrefs(patch: Partial<SchedulePrefs>) {
    const next = { ...prefs, ...patch }
    schedule.saveSchedulePrefs(next)
    if (next.mode !== prefs.mode) setLoading(true)
    setPrefsState(next)
  }

  // El spinner y el error se reinician al cambiar de día; el efecto solo trae los datos.
  function changeDay(next: Date) {
    if (next.getTime() === day.getTime()) return
    setLoading(true)
    setError(null)
    setDay(next)
  }

  const step = prefs.mode === 'week' ? 7 : 1

  function openDay(next: Date) {
    changeDay(schedule.startOfDay(next))
    setPrefs({ mode: 'day' })
  }

  // ── Mutaciones con "Deshacer" ──

  function fail(err: unknown, message: string) {
    setError(extractErrorMessage(err, message))
  }

  async function createMany(payloads: CreateTimeBlockDTO[]): Promise<TimeBlock[]> {
    const created: TimeBlock[] = []
    for (const payload of payloads) created.push(await api.createTimeBlock(payload))
    setBlocks((prev) => created.reduce(schedule.addBlock, prev))
    return created
  }

  async function deleteMany(ids: string[]) {
    await Promise.all(ids.map((id) => api.deleteTimeBlock(id)))
    setBlocks((prev) => prev.filter((block) => !ids.includes(block.id)))
  }

  function offerUndoCreate(created: TimeBlock[], message: string) {
    if (created.length === 0) return
    setUndo({ message, undo: () => deleteMany(created.map((block) => block.id)) })
  }

  async function patchMany(updates: { block: TimeBlock; patch: UpdateTimeBlockDTO }[]) {
    setBlocks((prev) => updates.reduce((acc, { block, patch }) => schedule.replaceBlock(acc, { ...block, ...patch } as TimeBlock), prev))
    try {
      const saved = await Promise.all(updates.map(({ block, patch }) => api.updateTimeBlock(block.id, patch)))
      setBlocks((prev) => saved.reduce(schedule.replaceBlock, prev))
    } catch (err) {
      setBlocks((prev) => updates.reduce((acc, { block }) => schedule.replaceBlock(acc, block), prev))
      throw err
    }
  }

  /** Mueve/redimensiona bloques; "Deshacer" los devuelve a su tramo anterior. */
  async function applyMoves(moves: Move[], message: string) {
    if (moves.length === 0) return
    setError(null)
    const forward = moves.map(({ block, span }) => ({ block, patch: schedule.spanToTimes(span, day) }))
    try {
      await patchMany(forward)
      setUndo({
        message,
        undo: () =>
          patchMany(
            moves.map(({ block }) => ({
              block: { ...block, ...forward.find((f) => f.block.id === block.id)?.patch } as TimeBlock,
              patch: { start_time: block.start_time, end_time: block.end_time },
            })),
          ),
      })
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  const commitSpan = (block: TimeBlock, span: BlockSpan) => applyMoves([{ block, span }], 'Bloque actualizado.')

  async function placeTask(taskId: string, minute: number) {
    const task = tasksById.get(taskId)
    if (!task) return
    setError(null)
    setSelectedTaskId(null)
    try {
      offerUndoCreate(await createMany([schedule.blockFromTask(task, day, minute)]), 'Tarea agendada.')
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  async function remove(block: TimeBlock) {
    setError(null)
    setEditor(null)
    setBlocks((prev) => schedule.removeBlock(prev, block.id))
    try {
      await api.deleteTimeBlock(block.id)
      setUndo({ message: `Se eliminó «${block.title}».`, undo: async () => void (await createMany([schedule.recreatePayload(block)])) })
    } catch (err) {
      setBlocks((prev) => schedule.addBlock(prev, block))
      fail(err, schedule.SCHEDULE_DELETE_ERROR)
    }
  }

  async function runUndo() {
    const action = undo
    setUndo(null)
    if (!action) return
    try {
      await action.undo()
    } catch (err) {
      fail(err, schedule.SCHEDULE_SAVE_ERROR)
    }
  }

  // ── Planificación inteligente ──

  async function autoScheduleDay() {
    setError(null)
    setBusy(true)
    const { planned, skipped } = schedule.autoSchedule(tasks, blocks, day, prefs.workHours, nowMinute)
    try {
      offerUndoCreate(await createMany(planned), 'Agendado automático aplicado.')
      setNotice(schedule.autoScheduleMessage(planned.length, skipped.length))
    } catch (err) {
      fail(err, schedule.AUTO_SCHEDULE_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function copyPreviousDay() {
    setError(null)
    setBusy(true)
    const previous = schedule.addDays(day, -1)
    try {
      const source = await api.getSchedule(schedule.dayRange(previous))
      const created = await createMany(schedule.copyBlocksToDay(source, previous, day))
      offerUndoCreate(created, 'Se copió el día anterior.')
      setNotice(created.length === 0 ? 'El día anterior no tiene bloques para copiar.' : `Se copiaron ${created.length} bloques del día anterior.`)
    } catch (err) {
      fail(err, schedule.COPY_DAY_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function moveToNextSlot(block: TimeBlock) {
    const slot = schedule.nextFreeSlotFor(block, blocks, day)
    setEditor(null)
    if (slot) await applyMoves([{ block, span: slot }], `«${block.title}» se movió al siguiente hueco libre.`)
  }

  async function pushFollowing(block: TimeBlock) {
    setEditor(null)
    await applyMoves(schedule.pushFollowing(block, blocks, day), 'Se corrieron los bloques siguientes.')
  }

  // ── Editor ──

  async function saveEditor(values: BlockFormValues) {
    const target = editor
    if (!target) return
    const base = schedule.formBaseDay(target.block, day)
    if (!target.block) {
      const created = await createMany([schedule.buildCreateBlockPayload(values, base)])
      offerUndoCreate(created, 'Bloque creado.')
      setEditor(null)
      return
    }
    const block = target.block
    const updated = await api.updateTimeBlock(block.id, schedule.buildUpdateBlockPayload(values, base))
    setBlocks((prev) => schedule.replaceBlock(prev, updated))
    if (schedule.shouldCompleteTask(block, values, tasksById) && block.task_id) {
      try {
        const task = await api.updateTask(block.task_id, { status: 'completed' })
        setTasks((prev) => prev.map((candidate) => (candidate.id === task.id ? task : candidate)))
      } catch (err) {
        fail(err, TASK_UPDATE_ERROR)
      }
    }
    setEditor(null)
  }

  /** "Enfocar": el Pomodoro imputará sus bloques de trabajo a este bloque. */
  function focus(block: TimeBlock) {
    schedule.saveFocusTarget(schedule.focusTargetFor(block))
    navigate('/pomodoro')
  }

  return {
    prefs,
    setPrefs,
    view: schedule.viewWindow(prefs.zoom, prefs.workHours),
    day,
    isToday: schedule.isSameDay(day, new Date(now)),
    goToDay: (offset: number) => changeDay(schedule.addDays(day, offset * step)),
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
    dismissNotice: () => setNotice(null),
    selectedTaskId,
    selectTask: (id: string | null) => setSelectedTaskId((prev) => (prev === id ? null : id)),
    editor,
    openEditor: setEditor,
    closeEditor: () => setEditor(null),
    saveEditor,
    undo,
    runUndo,
    dismissUndo: () => setUndo(null),
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

export type ScheduleState = ReturnType<typeof useSchedule>
