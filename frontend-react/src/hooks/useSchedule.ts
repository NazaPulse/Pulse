import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as schedule from '@shared/schedule'
import type { ScheduleMode, SchedulePrefs, UndoAction } from '@shared/schedule'
import { TASK_LOAD_ERROR } from '@shared/tasks'
import { api, extractErrorMessage } from '../lib/api'
import type { Task, TimeBlock } from '../types/productivity'
import * as actions from './scheduleActions'
import type { EditorTarget, ScheduleContext, ScheduleStore } from './scheduleActions'
import { useNow } from './useNow'

export type { EditorTarget } from './scheduleActions'

const NO_BLOCKS: TimeBlock[] = []
const NO_TASKS: Task[] = []

/** Día, preferencias y datos (con sus estados de carga). */
function useDataState() {
  const [prefs, setPrefsState] = useState<SchedulePrefs>(() => schedule.loadSchedulePrefs())
  const [day, setDay] = useState(() => schedule.startOfDay(new Date()))
  const [blocks, setBlocks] = useState<TimeBlock[]>(NO_BLOCKS)
  const [tasks, setTasks] = useState<Task[]>(NO_TASKS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  return { prefs, setPrefsState, day, setDay, blocks, setBlocks, tasks, setTasks, loading, setLoading, error, setError }
}

/** Avisos, selección de tarea, editor y "Deshacer". */
function useUiState() {
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [undo, setUndo] = useState<UndoAction | null>(null)
  return { notice, setNotice, busy, setBusy, selectedTaskId, setSelectedTaskId, editor, setEditor, undo, setUndo }
}

function useScheduleStore(): ScheduleStore {
  return { ...useDataState(), ...useUiState() }
}

type BlocksRequest = Pick<ScheduleStore, 'day' | 'setBlocks' | 'setError' | 'setLoading'> & { mode: ScheduleMode }

const visibleRange = (mode: ScheduleMode, day: Date) =>
  mode === 'week' ? schedule.weekRange(day) : schedule.dayRange(day)

/** Pide los bloques del día (o de la semana) visible; no aplica la respuesta si `isCancelled()`. */
function fetchBlocks(request: BlocksRequest, isCancelled: () => boolean) {
  api
    .getSchedule(visibleRange(request.mode, request.day))
    .then((rows) => !isCancelled() && request.setBlocks(schedule.sortBlocks(rows)))
    .catch((err) => !isCancelled() && request.setError(extractErrorMessage(err, schedule.SCHEDULE_LOAD_ERROR)))
    .finally(() => !isCancelled() && request.setLoading(false))
}

/** Bloques visibles; se vuelven a pedir al cambiar de día o de vista. */
function useBlocksLoader(store: ScheduleStore) {
  const { day, setBlocks, setError, setLoading } = store
  const mode = store.prefs.mode
  useEffect(() => {
    let cancelled = false
    fetchBlocks({ day, mode, setBlocks, setError, setLoading }, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [day, mode, setBlocks, setError, setLoading])
}

function useTasksLoader({ setTasks, setError }: ScheduleStore) {
  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(extractErrorMessage(err, TASK_LOAD_ERROR)))
  }, [setTasks, setError])
}

/** El aviso "Deshacer" se descarta solo. */
function useUndoExpiry({ undo, setUndo }: ScheduleStore) {
  useEffect(() => {
    if (!undo) return
    const id = window.setTimeout(() => setUndo(null), schedule.UNDO_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [undo, setUndo])
}

function useDerived(blocks: TimeBlock[], tasks: Task[]) {
  const conflicts = useMemo(() => schedule.findConflicts(blocks), [blocks])
  const layout = useMemo(() => schedule.assignLanes(blocks), [blocks])
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const pending = useMemo(() => schedule.pendingTasks(tasks), [tasks])
  const scheduledIds = useMemo(() => schedule.scheduledTaskIds(blocks), [blocks])
  const summary = useMemo(() => schedule.daySummary(blocks), [blocks])
  return { conflicts, layout, tasksById, pending, scheduledIds, summary }
}

/** Día/semana visible, preferencias y datos para dibujar la pantalla. */
function viewState(ctx: ScheduleContext, now: number, derived: ReturnType<typeof useDerived>) {
  const step = ctx.prefs.mode === 'week' ? 7 : 1
  return {
    prefs: ctx.prefs,
    setPrefs: (patch: Partial<SchedulePrefs>) => actions.setPrefs(ctx, patch),
    view: schedule.viewWindow(ctx.prefs.zoom, ctx.prefs.workHours),
    day: ctx.day,
    isToday: schedule.isSameDay(ctx.day, new Date(now)),
    goToDay: (offset: number) => actions.changeDay(ctx, schedule.addDays(ctx.day, offset * step)),
    goToToday: () => actions.changeDay(ctx, schedule.startOfDay(new Date())),
    openDay: (next: Date) => actions.openDay(ctx, next),
    blocks: ctx.blocks,
    pending: derived.pending,
    tasksById: derived.tasksById,
    scheduledIds: derived.scheduledIds,
    conflicts: derived.conflicts,
    layout: derived.layout,
    summary: derived.summary,
    nowMinute: ctx.nowMinute,
  }
}

/** Estados de carga, avisos, selección y editor. */
function panelState(ctx: ScheduleContext) {
  return {
    loading: ctx.loading,
    busy: ctx.busy,
    error: ctx.error,
    notice: ctx.notice,
    dismissNotice: () => ctx.setNotice(null),
    selectedTaskId: ctx.selectedTaskId,
    selectTask: (id: string | null) => ctx.setSelectedTaskId((prev) => (prev === id ? null : id)),
    editor: ctx.editor,
    openEditor: ctx.setEditor,
    closeEditor: () => ctx.setEditor(null),
    saveEditor: (values: Parameters<typeof actions.saveEditor>[1]) => actions.saveEditor(ctx, values),
    undo: ctx.undo,
    runUndo: () => actions.runUndo(ctx),
    dismissUndo: () => ctx.setUndo(null),
  }
}

/** Acciones sobre los bloques y planificación inteligente. */
function blockCommands(ctx: ScheduleContext) {
  return {
    placeTask: (taskId: string, minute: number) => actions.placeTask(ctx, taskId, minute),
    commitSpan: (block: TimeBlock, span: Parameters<typeof actions.commitSpan>[2]) =>
      actions.commitSpan(ctx, block, span),
    remove: (block: TimeBlock) => actions.remove(ctx, block),
    focus: (block: TimeBlock) => actions.focus(ctx, block),
    autoScheduleDay: () => actions.autoScheduleDay(ctx),
    copyPreviousDay: () => actions.copyPreviousDay(ctx),
    moveToNextSlot: (block: TimeBlock) => actions.moveToNextSlot(ctx, block),
    pushFollowing: (block: TimeBlock) => actions.pushFollowing(ctx, block),
  }
}

/**
 * Estado del Cronograma: día/semana visible, preferencias, bloques, tareas, editor, aviso
 * "Deshacer" y acciones de planificación inteligente (todas con actualización optimista).
 */
export function useSchedule() {
  const navigate = useNavigate()
  const store = useScheduleStore()
  const now = useNow(30_000)
  useBlocksLoader(store)
  useTasksLoader(store)
  useUndoExpiry(store)
  const derived = useDerived(store.blocks, store.tasks)
  const ctx: ScheduleContext = {
    ...store,
    tasksById: derived.tasksById,
    nowMinute: schedule.nowMinute(now, store.day),
    navigate,
  }
  return { ...viewState(ctx, now, derived), ...panelState(ctx), ...blockCommands(ctx) }
}

export type ScheduleState = ReturnType<typeof useSchedule>
