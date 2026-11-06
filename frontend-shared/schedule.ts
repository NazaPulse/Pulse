// Reglas del Cronograma diario (Gantt) independientes del framework: geometría de la grilla y
// zoom, conflictos y carriles, arrastre con imán y teclado, huecos libres, agendado automático,
// resolución de conflictos, formulario de bloque, resumen planificado vs. real, semana,
// preferencias y foco Pomodoro. Los componentes de cada frontend solo las conectan a su estado.
import { MODE_DURATIONS_MS } from './pomodoro'
import { withDefaults } from './utils/withDefaults'
import type {
  CreateTimeBlockDTO,
  ScheduleRange,
  Task,
  TaskPriority,
  TimeBlock,
  TimeBlockCategory,
  UpdateTimeBlockDTO,
} from './types'

export const DAY_MINUTES = 24 * 60
/** Paso de la grilla al soltar, mover o redimensionar. */
export const SNAP_MINUTES = 15
export const MIN_BLOCK_MINUTES = 15
/** Duración de un bloque creado desde una tarea sin duración estimada. */
export const DEFAULT_DROP_MINUTES = 60
/** Distancia (min) a la que un borde se "pega" al de un bloque vecino. */
export const MAGNET_MINUTES = 10
/** Desplazamiento del puntero (px) a partir del cual un clic pasa a ser un arrastre. */
export const DRAG_THRESHOLD_PX = 4

/** Tipo MIME del drag & drop nativo de una tarea del panel lateral. */
export const TASK_DRAG_MIME = 'application/x-pulse-task'

export const SCHEDULE_LOAD_ERROR = 'No se pudo cargar tu cronograma.'
export const SCHEDULE_SAVE_ERROR = 'No se pudo guardar el bloque.'
export const SCHEDULE_DELETE_ERROR = 'No se pudo eliminar el bloque.'
export const AUTO_SCHEDULE_ERROR = 'No se pudieron agendar todas las tareas.'
export const COPY_DAY_ERROR = 'No se pudo copiar el día anterior.'

const MINUTE_MS = 60_000

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// ── Días y semanas ──────────────────────────────────────────

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days)
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

/** Rango `[00:00, 24:00)` del día en la zona horaria local, para `GET /api/schedule`. */
export function dayRange(day: Date): Required<ScheduleRange> {
  return { from: startOfDay(day).toISOString(), to: addDays(day, 1).toISOString() }
}

/** Lunes de la semana del día. */
export function weekStart(day: Date): Date {
  const start = startOfDay(day)
  return addDays(start, -((start.getDay() + 6) % 7))
}

export const weekDays = (day: Date) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(day), i))

export function weekRange(day: Date): Required<ScheduleRange> {
  const start = weekStart(day)
  return { from: start.toISOString(), to: addDays(start, 7).toISOString() }
}

const dayTitleFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric' })
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export const dayTitle = (day: Date) => capitalize(dayTitleFormatter.format(day))
export const shortDayLabel = (day: Date) => capitalize(shortDayFormatter.format(day))

export function weekTitle(day: Date): string {
  const [first, last] = [weekStart(day), addDays(weekStart(day), 6)]
  return `Semana del ${shortDayLabel(first)} al ${shortDayLabel(last)}`
}

// ── Minutos del día ─────────────────────────────────────────

/** Minutos desde el inicio del día (negativo o > 1440 si el instante cae fuera). */
export function minuteOfDay(iso: string, dayStart: Date): number {
  return (new Date(iso).getTime() - dayStart.getTime()) / MINUTE_MS
}

export function minuteToIso(dayStart: Date, minute: number): string {
  return new Date(dayStart.getTime() + minute * MINUTE_MS).toISOString()
}

export const snap = (minutes: number) => Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
const snapUp = (minutes: number) => Math.ceil(minutes / SNAP_MINUTES) * SNAP_MINUTES

/** Tramo de un bloque en minutos del día. */
export interface BlockSpan {
  start: number
  end: number
}

export function blockSpan(block: TimeBlock, dayStart: Date): BlockSpan {
  return { start: minuteOfDay(block.start_time, dayStart), end: minuteOfDay(block.end_time, dayStart) }
}

export function spanToTimes(span: BlockSpan, dayStart: Date): Pick<TimeBlock, 'start_time' | 'end_time'> {
  return { start_time: minuteToIso(dayStart, span.start), end_time: minuteToIso(dayStart, span.end) }
}

export const sameSpan = (a: BlockSpan, b: BlockSpan) => a.start === b.start && a.end === b.end

// ── Zoom: ventana visible de la grilla ──────────────────────

/** `day` muestra las 24 h; `work` solo el horario laboral (cabe sin scroll). */
export type ZoomMode = 'day' | 'work'

/** Horario laboral en minutos del día (horas enteras). */
export interface WorkHours {
  start: number
  end: number
}

export const DEFAULT_WORK_HOURS: WorkHours = { start: 9 * 60, end: 18 * 60 }
export const FULL_DAY: BlockSpan = { start: 0, end: DAY_MINUTES }

export const viewWindow = (zoom: ZoomMode, hours: WorkHours): BlockSpan =>
  zoom === 'work' ? { start: hours.start, end: hours.end } : FULL_DAY

const viewMinutes = (view: BlockSpan) => view.end - view.start

/** Marcas horarias del encabezado dentro de la ventana (p. ej. 00:00 … 24:00). */
export function hourMarks(view: BlockSpan): number[] {
  const first = Math.ceil(view.start / 60)
  const last = Math.floor(view.end / 60)
  return Array.from({ length: last - first + 1 }, (_, i) => (first + i) * 60)
}

export function minuteToPercent(minute: number, view: BlockSpan = FULL_DAY): string {
  return `${((clamp(minute, view.start, view.end) - view.start) / viewMinutes(view)) * 100}%`
}

/** Posición horizontal (en % de la grilla) recortada a la ventana visible. */
export function spanStyle(span: BlockSpan, view: BlockSpan = FULL_DAY): { left: string; width: string } {
  const start = clamp(span.start, view.start, view.end)
  const end = clamp(span.end, view.start, view.end)
  const total = viewMinutes(view)
  return { left: `${((start - view.start) / total) * 100}%`, width: `${((end - start) / total) * 100}%` }
}

/** Partes del bloque fuera de la ventana (cruza la medianoche o el horario laboral). */
export function clippedEdges(span: BlockSpan, view: BlockSpan) {
  return { before: span.start < view.start, after: span.end > view.end }
}

export const isVisible = (span: BlockSpan, view: BlockSpan) => span.end > view.start && span.start < view.end

/** Una línea vertical por hora; la grilla de 24 h necesita scroll, la laboral cabe entera. */
export function gridStyle(view: BlockSpan, zoom: ZoomMode) {
  return {
    backgroundImage: 'linear-gradient(to right, rgb(148 163 184 / 0.12) 1px, transparent 1px)',
    backgroundSize: `calc(100% / ${viewMinutes(view) / 60}) 100%`,
    minWidth: zoom === 'day' ? '144rem' : '0',
  }
}

/** Minuto (ajustado a la grilla) bajo el puntero dentro de la pista. */
export function minuteAtPointer(clientX: number, track: { left: number; width: number }, view: BlockSpan = FULL_DAY): number {
  const raw = view.start + ((clientX - track.left) / track.width) * viewMinutes(view)
  return clamp(snap(raw), view.start, view.end - MIN_BLOCK_MINUTES)
}

/** Minutos que representa un desplazamiento horizontal del puntero. */
export const pixelsToMinutes = (dx: number, trackWidth: number, view: BlockSpan = FULL_DAY) =>
  (dx / trackWidth) * viewMinutes(view)

/**
 * Minuto que queda en el borde izquierdo al abrir la grilla: una hora antes de "ahora" (hoy),
 * del primer bloque (otros días) o de las 08:00 si el día está vacío.
 */
export function initialScrollMinute(nowMinuteOfDay: number | null, blocks: TimeBlock[], dayStart: Date): number {
  const first = blocks.length > 0 ? minuteOfDay(sortBlocks(blocks)[0].start_time, dayStart) : 8 * 60
  return clamp((nowMinuteOfDay ?? first) - 60, 0, DAY_MINUTES)
}

// ── Arrastre, imán y teclado ────────────────────────────────

/** `move` desplaza el bloque entero; `start`/`end` redimensionan el borde correspondiente. */
export type DragMode = 'move' | 'start' | 'end'

export function dragSpan(span: BlockSpan, mode: DragMode, deltaMinutes: number): BlockSpan {
  const delta = snap(deltaMinutes)
  if (mode === 'start') {
    return { start: clamp(span.start + delta, Math.min(0, span.start), span.end - MIN_BLOCK_MINUTES), end: span.end }
  }
  if (mode === 'end') {
    return { start: span.start, end: clamp(span.end + delta, span.start + MIN_BLOCK_MINUTES, Math.max(DAY_MINUTES, span.end)) }
  }
  const shift = clamp(delta, Math.min(0, -span.start), Math.max(0, DAY_MINUTES - span.end))
  return { start: span.start + shift, end: span.end + shift }
}

const withinMagnet = (distance: number) => distance > 0 && distance <= MAGNET_MINUTES

/** Borde vecino más cercano a `minute` dentro del umbral del imán, o `null` (ante empates, el primero). */
function nearestEdge(minute: number, edges: number[]): number | null {
  const candidates = edges.filter((edge) => withinMagnet(Math.abs(edge - minute)))
  return candidates.reduce<number | null>(
    (best, edge) => (best === null || Math.abs(edge - minute) < Math.abs(best - minute) ? edge : best),
    null,
  )
}

/** Desplazamiento de `from` hasta `edge`, o `null` si no hay borde. */
const shiftTo = (edge: number | null, from: number) => (edge === null ? null : edge - from)

const smallestShift = (shifts: number[]) => shifts.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a))

function magnetStart(span: BlockSpan, edges: number[]): BlockSpan {
  const edge = nearestEdge(span.start, edges)
  return edge !== null && edge <= span.end - MIN_BLOCK_MINUTES ? { ...span, start: edge } : span
}

function magnetEnd(span: BlockSpan, edges: number[]): BlockSpan {
  const edge = nearestEdge(span.end, edges)
  return edge !== null && edge >= span.start + MIN_BLOCK_MINUTES ? { ...span, end: edge } : span
}

/** Al mover, pega el borde (inicio o fin) que quede más cerca de un vecino. */
function magnetMove(span: BlockSpan, edges: number[]): BlockSpan {
  const shifts = [shiftTo(nearestEdge(span.start, edges), span.start), shiftTo(nearestEdge(span.end, edges), span.end)]
  const valid = shifts.filter((shift): shift is number => shift !== null)
  if (valid.length === 0) return span
  const shift = smallestShift(valid)
  return { start: span.start + shift, end: span.end + shift }
}

const MAGNETS: Record<DragMode, (span: BlockSpan, edges: number[]) => BlockSpan> = {
  start: magnetStart,
  end: magnetEnd,
  move: magnetMove,
}

/** Imán: pega el borde arrastrado (o el más cercano, al mover) al de un bloque vecino. */
export function magnetize(span: BlockSpan, mode: DragMode, others: BlockSpan[]): BlockSpan {
  const edges = others.flatMap((other) => [other.start, other.end])
  return MAGNETS[mode](span, edges)
}

const KEY_DELTAS = new Map([
  ['ArrowLeft', -SNAP_MINUTES],
  ['ArrowRight', SNAP_MINUTES],
])

/** Con Shift se ajusta el fin, con Alt el inicio; sin modificadores se mueve el bloque. */
function keyboardMode(mods: { shift: boolean; alt: boolean }): DragMode {
  if (mods.shift) return 'end'
  return mods.alt ? 'start' : 'move'
}

/** Teclado: ←/→ mueve 15 min; con Shift ajusta el fin y con Alt el inicio. `null` si no aplica. */
export function keyboardSpan(span: BlockSpan, key: string, mods: { shift: boolean; alt: boolean }): BlockSpan | null {
  const delta = KEY_DELTAS.get(key)
  if (delta === undefined) return null
  const next = dragSpan(span, keyboardMode(mods), delta)
  return sameSpan(next, span) ? null : next
}

// ── Conflictos y carriles ───────────────────────────────────

const startMs = (block: TimeBlock) => new Date(block.start_time).getTime()
const endMs = (block: TimeBlock) => new Date(block.end_time).getTime()

export function sortBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort((a, b) => startMs(a) - startMs(b) || endMs(a) - endMs(b))
}

/** Ids de los bloques que comparten franja horaria con otro (los bordes que se tocan no cuentan). */
export function findConflicts(blocks: TimeBlock[]): Set<string> {
  const sorted = sortBlocks(blocks)
  const conflicts = new Set<string>()
  sorted.forEach((block, i) => {
    for (let j = i + 1; j < sorted.length && startMs(sorted[j]) < endMs(block); j++) {
      conflicts.add(block.id)
      conflicts.add(sorted[j].id)
    }
  })
  return conflicts
}

/** Fila de cada bloque: los que se superponen se apilan en filas distintas. */
export function assignLanes(blocks: TimeBlock[]): { lanes: Map<string, number>; laneCount: number } {
  const laneEnds: number[] = []
  const lanes = new Map<string, number>()
  for (const block of sortBlocks(blocks)) {
    let lane = laneEnds.findIndex((end) => end <= startMs(block))
    if (lane === -1) lane = laneEnds.push(0) - 1
    laneEnds[lane] = endMs(block)
    lanes.set(block.id, lane)
  }
  return { lanes, laneCount: Math.max(1, laneEnds.length) }
}

export const blocksOnDay = (blocks: TimeBlock[], day: Date) =>
  blocks.filter((block) => isVisible(blockSpan(block, startOfDay(day)), FULL_DAY))

// ── Huecos libres ───────────────────────────────────────────

/** Tramos ocupados del día, ordenados y fusionados. */
export function busySpans(blocks: TimeBlock[], dayStart: Date): BlockSpan[] {
  const merged: BlockSpan[] = []
  for (const span of sortBlocks(blocks).map((block) => blockSpan(block, dayStart))) {
    const last = merged[merged.length - 1]
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end)
    else merged.push({ ...span })
  }
  return merged
}

/** Primer hueco de `duration` minutos dentro de `window` (inicio ajustado a la grilla), o `null`. */
export function findSlot(duration: number, busy: BlockSpan[], window: BlockSpan): BlockSpan | null {
  let cursor = snapUp(window.start)
  for (const span of busy) {
    if (span.end <= cursor) continue
    if (span.start >= cursor + duration) break
    cursor = snapUp(Math.max(cursor, span.end))
  }
  return cursor + duration <= window.end ? { start: cursor, end: cursor + duration } : null
}

// ── Planificación inteligente ───────────────────────────────

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
const dueMs = (task: Task) => (task.due_date ? new Date(task.due_date).getTime() : Number.POSITIVE_INFINITY)

export const pendingTasks = (tasks: Task[]) => tasks.filter((task) => task.status === 'pending')

export const taskDuration = (task: Task) => task.estimated_minutes ?? DEFAULT_DROP_MINUTES

/** Orden de agendado: prioridad, luego vencimiento más cercano, luego antigüedad. */
export function rankTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      dueMs(a) - dueMs(b) ||
      a.created_at.localeCompare(b.created_at),
  )
}

export const scheduledTaskIds = (blocks: TimeBlock[]) =>
  new Set(blocks.map((block) => block.task_id).filter((id): id is string => id !== null))

export function blockFromTask(task: Task, dayStart: Date, minute: number): CreateTimeBlockDTO {
  const start = clamp(snap(minute), 0, DAY_MINUTES - MIN_BLOCK_MINUTES)
  const end = Math.min(start + taskDuration(task), DAY_MINUTES)
  return { title: task.title, category: 'work', task_id: task.id, ...spanToTimes({ start, end }, dayStart) }
}

/** Franja disponible para agendar: el horario laboral, desde "ahora" si el día es hoy. */
export const planningWindow = (hours: WorkHours, nowMinuteOfDay: number | null): BlockSpan => ({
  start: Math.max(hours.start, nowMinuteOfDay ?? 0),
  end: hours.end,
})

/**
 * Agendado automático: ubica las tareas pendientes aún no agendadas, en orden de prioridad y
 * vencimiento, en el primer hueco libre de `window` (ver {@link planningWindow}).
 */
export function autoSchedule(
  tasks: Task[],
  blocks: TimeBlock[],
  dayStart: Date,
  window: BlockSpan,
): { planned: CreateTimeBlockDTO[]; skipped: Task[] } {
  const taken = scheduledTaskIds(blocks)
  const busy = busySpans(blocks, dayStart)
  const planned: CreateTimeBlockDTO[] = []
  const skipped: Task[] = []

  for (const task of rankTasks(pendingTasks(tasks)).filter((candidate) => !taken.has(candidate.id))) {
    const slot = findSlot(taskDuration(task), busy, window)
    if (!slot) {
      skipped.push(task)
      continue
    }
    planned.push({ title: task.title, category: 'work', task_id: task.id, ...spanToTimes(slot, dayStart) })
    busy.push(slot)
    busy.sort((a, b) => a.start - b.start)
  }
  return { planned, skipped }
}

export function autoScheduleMessage(planned: number, skipped: number): string {
  if (planned === 0 && skipped === 0) return 'No hay tareas pendientes sin agendar.'
  const done = planned === 1 ? '1 tarea agendada' : `${planned} tareas agendadas`
  return skipped === 0 ? `${done}.` : `${done}; ${skipped} no entraron en el horario laboral.`
}

/** Conflicto → primer hueco libre (desde el inicio del bloque) con su misma duración. */
export function nextFreeSlotFor(block: TimeBlock, blocks: TimeBlock[], dayStart: Date): BlockSpan | null {
  const span = blockSpan(block, dayStart)
  const busy = busySpans(blocks.filter((other) => other.id !== block.id), dayStart)
  return findSlot(span.end - span.start, busy, { start: span.start, end: Number.POSITIVE_INFINITY })
}

/** Conflicto → corre en cascada los bloques que empiezan después de este y se le superponen. */
export function pushFollowing(block: TimeBlock, blocks: TimeBlock[], dayStart: Date): { block: TimeBlock; span: BlockSpan }[] {
  const own = blockSpan(block, dayStart)
  let cursor = own.end
  const moves: { block: TimeBlock; span: BlockSpan }[] = []
  for (const other of sortBlocks(blocks)) {
    if (other.id === block.id) continue
    const span = blockSpan(other, dayStart)
    if (span.start < own.start) continue
    if (span.start < cursor) {
      const next = { start: cursor, end: cursor + (span.end - span.start) }
      moves.push({ block: other, span: next })
      cursor = next.end
    } else {
      cursor = Math.max(cursor, span.end)
    }
  }
  return moves
}

/** El bloque termina después del vencimiento de su tarea. */
export function isPastDeadline(block: TimeBlock, tasksById: ReadonlyMap<string, Task>): boolean {
  const task = block.task_id ? tasksById.get(block.task_id) : undefined
  return Boolean(task?.due_date && task.status === 'pending' && endMs(block) > new Date(task.due_date).getTime())
}

// ── Copiar el día anterior ──────────────────────────────────

/** Bloques que empiezan en `fromDay`, recreados a la misma hora en `toDay` (sin minutos reales). */
export function copyBlocksToDay(blocks: TimeBlock[], fromDay: Date, toDay: Date): CreateTimeBlockDTO[] {
  const from = startOfDay(fromDay)
  const to = startOfDay(toDay)
  return sortBlocks(blocks)
    .filter((block) => isSameDay(new Date(block.start_time), from))
    .map((block) => {
      const span = blockSpan(block, from)
      const payload: CreateTimeBlockDTO = { title: block.title, category: block.category, ...spanToTimes(span, to) }
      if (block.description) payload.description = block.description
      if (block.task_id) payload.task_id = block.task_id
      return payload
    })
}

// ── Planificado vs. real ────────────────────────────────────

export const plannedMinutes = (block: TimeBlock) => Math.round((endMs(block) - startMs(block)) / MINUTE_MS)

/** Porción del tiempo planificado cubierta por los minutos reales (0–1). */
export function actualRatio(block: TimeBlock): number {
  const planned = plannedMinutes(block)
  return planned > 0 ? clamp(block.actual_duration_minutes / planned, 0, 1) : 0
}

export const isOverrun = (block: TimeBlock) => block.actual_duration_minutes > plannedMinutes(block)

export interface CategoryTotals {
  category: TimeBlockCategory
  planned: number
  actual: number
}

/**
 * Resumen del día por categoría. El cumplimiento es la porción de lo planificado que se
 * cubrió con tiempo real (un bloque excedido cuenta como 100 %, no compensa a otros).
 */
export function daySummary(blocks: TimeBlock[]) {
  const totals = new Map<TimeBlockCategory, CategoryTotals>()
  let covered = 0
  for (const block of blocks) {
    const planned = plannedMinutes(block)
    const row = totals.get(block.category) ?? { category: block.category, planned: 0, actual: 0 }
    row.planned += planned
    row.actual += block.actual_duration_minutes
    totals.set(block.category, row)
    covered += Math.min(block.actual_duration_minutes, planned)
  }
  const rows = CATEGORIES.map((category) => totals.get(category)).filter((row): row is CategoryTotals => Boolean(row))
  const planned = rows.reduce((sum, row) => sum + row.planned, 0)
  const actual = rows.reduce((sum, row) => sum + row.actual, 0)
  return { rows, planned, actual, adherence: planned > 0 ? Math.round((covered / planned) * 100) : null }
}

// ── Cambios locales (actualización optimista) ───────────────

export const replaceBlock = (blocks: TimeBlock[], updated: TimeBlock) =>
  sortBlocks(blocks.map((block) => (block.id === updated.id ? updated : block)))

export const removeBlock = (blocks: TimeBlock[], id: string) => blocks.filter((block) => block.id !== id)

export const addBlock = (blocks: TimeBlock[], created: TimeBlock) => sortBlocks([...blocks, created])

/** Datos para volver a crear un bloque eliminado ("Deshacer"). */
export function recreatePayload(block: TimeBlock): CreateTimeBlockDTO {
  const payload: CreateTimeBlockDTO = {
    title: block.title,
    start_time: block.start_time,
    end_time: block.end_time,
    category: block.category,
    actual_duration_minutes: block.actual_duration_minutes,
    is_completed: block.is_completed,
  }
  if (block.description) payload.description = block.description
  if (block.task_id) payload.task_id = block.task_id
  return payload
}

/** Acción reversible del aviso "Deshacer". */
export interface UndoAction {
  message: string
  undo: () => Promise<void>
}

export const UNDO_TIMEOUT_MS = 10_000

// ── Formulario de bloque (crear / editar) ───────────────────

export const BLOCK_TITLE_MAX_LENGTH = 200
export const BLOCK_DESCRIPTION_MAX_LENGTH = 1000

export interface BlockFormValues {
  title: string
  description: string
  category: TimeBlockCategory
  /** `HH:mm` de `<input type="time">`. */
  start: string
  end: string
  /** El fin cae al día siguiente (bloques que cruzan la medianoche). */
  endsNextDay: boolean
  /** Minutos reales como texto del `<input type="number">`. */
  actualMinutes: string
  isCompleted: boolean
  /** Al completar el bloque, completar también su tarea. */
  completeTask: boolean
}

const toTimeInput = (minute: number) => formatMinute(((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES)

export function parseTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [hours, minutes] = [Number(match[1]), Number(match[2])]
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null
}

/** Día de referencia del formulario: el del inicio del bloque (o el día visible al crear). */
export const formBaseDay = (block: TimeBlock | null, day: Date) => (block ? startOfDay(new Date(block.start_time)) : startOfDay(day))

const DEFAULT_FORM_SPAN: BlockSpan = { start: 9 * 60, end: 10 * 60 }

type BlockFormFields = Pick<BlockFormValues, 'title' | 'description' | 'category' | 'actualMinutes' | 'isCompleted'>

const NEW_BLOCK_FIELDS: BlockFormFields = { title: '', description: '', category: 'other', actualMinutes: '0', isCompleted: false }

function blockFields(block: TimeBlock): BlockFormFields {
  const fields = {
    title: block.title,
    description: block.description,
    category: block.category,
    actualMinutes: String(block.actual_duration_minutes ?? 0),
    isCompleted: block.is_completed,
  }
  return withDefaults(fields, NEW_BLOCK_FIELDS)
}

/** Tramo inicial del formulario: el del bloque, el elegido en la grilla o 09:00–10:00. */
const formSpan = (block: TimeBlock | null, base: Date, span?: BlockSpan) =>
  block ? blockSpan(block, base) : (span ?? DEFAULT_FORM_SPAN)

export function blockFormValues(block: TimeBlock | null, base: Date, span?: BlockSpan): BlockFormValues {
  const fields = block ? blockFields(block) : NEW_BLOCK_FIELDS
  const source = formSpan(block, base, span)
  return {
    title: fields.title,
    description: fields.description,
    category: fields.category,
    start: toTimeInput(source.start),
    end: toTimeInput(source.end),
    endsNextDay: source.end >= DAY_MINUTES,
    actualMinutes: fields.actualMinutes,
    isCompleted: fields.isCompleted,
    completeTask: true,
  }
}

/** Tramo del formulario relativo al día base; `null` si alguna hora es inválida. */
export function blockFormSpan(values: BlockFormValues): BlockSpan | null {
  const start = parseTime(values.start)
  const end = parseTime(values.end)
  if (start === null || end === null) return null
  return { start, end: end + (values.endsNextDay ? DAY_MINUTES : 0) }
}

const parseMinutes = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : null)

function textFieldsError(values: BlockFormValues): string | null {
  const title = values.title.trim()
  if (!title) return 'El título es obligatorio.'
  if (title.length > BLOCK_TITLE_MAX_LENGTH) return `El título admite hasta ${BLOCK_TITLE_MAX_LENGTH} caracteres.`
  if (values.description.length > BLOCK_DESCRIPTION_MAX_LENGTH) {
    return `La descripción admite hasta ${BLOCK_DESCRIPTION_MAX_LENGTH} caracteres.`
  }
  return null
}

function timeFieldsError(values: BlockFormValues): string | null {
  const span = blockFormSpan(values)
  if (!span) return 'Ingresá horas válidas (HH:mm).'
  if (span.start >= span.end) return 'La hora de fin debe ser posterior al inicio (marcá "termina al día siguiente" si cruza la medianoche).'
  if (parseMinutes(values.actualMinutes) === null) return 'Los minutos reales deben ser un número entero mayor o igual a 0.'
  return null
}

/** Primer error del formulario, o `null` si se puede enviar. */
export function blockFormError(values: BlockFormValues): string | null {
  return textFieldsError(values) ?? timeFieldsError(values)
}

function formFields(values: BlockFormValues, base: Date) {
  const span = blockFormSpan(values) as BlockSpan
  return {
    title: values.title.trim(),
    category: values.category,
    ...spanToTimes(span, base),
    actual_duration_minutes: parseMinutes(values.actualMinutes) ?? 0,
    is_completed: values.isCompleted,
  }
}

export function buildCreateBlockPayload(values: BlockFormValues, base: Date): CreateTimeBlockDTO {
  const payload: CreateTimeBlockDTO = formFields(values, base)
  const description = values.description.trim()
  if (description) payload.description = description
  return payload
}

export function buildUpdateBlockPayload(values: BlockFormValues, base: Date): UpdateTimeBlockDTO {
  return { ...formFields(values, base), description: values.description.trim() || null }
}

const linkedTask = (block: TimeBlock | null, tasksById: ReadonlyMap<string, Task>) =>
  block?.task_id ? tasksById.get(block.task_id) : undefined

/** El bloque pasa a completado en este guardado y se eligió completar también su tarea. */
const completesBlock = (block: TimeBlock | null, values: BlockFormValues) =>
  values.isCompleted && !block?.is_completed && values.completeTask

/** Se completa la tarea asociada si el bloque pasa a completado y se eligió hacerlo. */
export function shouldCompleteTask(block: TimeBlock | null, values: BlockFormValues, tasksById: ReadonlyMap<string, Task>) {
  const pending = linkedTask(block, tasksById)?.status === 'pending'
  return Boolean(pending && completesBlock(block, values))
}

// ── Presentación ────────────────────────────────────────────

export const CATEGORIES: TimeBlockCategory[] = ['work', 'exercise', 'leisure', 'sleep', 'other']

export const CATEGORY_LABELS: Record<TimeBlockCategory, string> = {
  work: 'Trabajo',
  sleep: 'Sueño',
  leisure: 'Ocio',
  exercise: 'Ejercicio',
  other: 'Otro',
}

/** Color de cada categoría (paleta "Pulse Dark Cyan"); el trabajo usa el cian de la marca. */
export const CATEGORY_COLORS: Record<TimeBlockCategory, string> = {
  work: '#00f0ff',
  sleep: '#b9a0ff',
  leisure: '#ffe08a',
  exercise: '#86e3ae',
  other: '#7db7ff',
}

const CONFLICT_COLOR = '#fb7185'

/** Estilos en línea de un bloque: fondo translúcido (planificado) y barra sólida brillante (real). */
export function blockColors(category: TimeBlockCategory, conflict: boolean) {
  const color = CATEGORY_COLORS[category]
  const edge = conflict ? CONFLICT_COLOR : color
  return {
    planned: {
      backgroundColor: `${color}1f`,
      borderColor: conflict ? edge : `${color}66`,
      boxShadow: conflict ? `0 0 0 1px ${edge}, 0 0 18px -4px ${edge}` : `inset 0 0 18px -10px ${color}`,
    },
    actual: { backgroundColor: color, boxShadow: `0 0 10px ${color}, 0 0 2px ${color}` },
  }
}

export function formatMinute(minute: number): string {
  const total = Math.round(clamp(minute, 0, DAY_MINUTES))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Rango horario; los extremos fuera del día se muestran como hora del día vecino. */
export function spanLabel(span: BlockSpan): string {
  const start = span.start < 0 ? `◂ ${toTimeInput(span.start)}` : formatMinute(span.start)
  const end = span.end > DAY_MINUTES ? `${toTimeInput(span.end)} ▸` : formatMinute(span.end)
  return `${start} – ${end}`
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export const progressLabel = (block: TimeBlock) =>
  `${durationLabel(block.actual_duration_minutes)} reales / ${durationLabel(plannedMinutes(block))} plan`

export function conflictsLabel(count: number): string {
  return count === 1 ? '1 bloque se superpone con otro.' : `${count} bloques se superponen en la misma franja horaria.`
}

/** Minuto actual si el día visible es hoy; `null` si no (no se dibuja la línea en vivo). */
export function nowMinute(now: number, dayStart: Date): number | null {
  const minute = (now - dayStart.getTime()) / MINUTE_MS
  return minute >= 0 && minute < DAY_MINUTES ? minute : null
}

// ── Preferencias del visor (localStorage) ───────────────────

export type ScheduleMode = 'day' | 'week'

export interface SchedulePrefs {
  mode: ScheduleMode
  zoom: ZoomMode
  workHours: WorkHours
  sidebarOpen: boolean
}

export const PREFS_STORAGE_KEY = 'pulse.schedule'
export const DEFAULT_PREFS: SchedulePrefs = { mode: 'day', zoom: 'day', workHours: DEFAULT_WORK_HOURS, sidebarOpen: true }

/** Horas enteras elegibles para el horario laboral. */
export const WORK_HOUR_OPTIONS = Array.from({ length: 25 }, (_, hour) => hour * 60)

const validHours = (hours: Partial<WorkHours> | undefined): hours is WorkHours =>
  typeof hours?.start === 'number' && typeof hours.end === 'number' && hours.start >= 0 && hours.end <= DAY_MINUTES && hours.start < hours.end

/** JSON guardado en `key`, o `null` si no hay nada. */
function readStoredJson<T>(storage: Pick<Storage, 'getItem'>, key: string): T | null {
  return JSON.parse(storage.getItem(key) ?? 'null') as T | null
}

/** Preferencias válidas a partir de lo guardado: cada valor desconocido vuelve al predeterminado. */
function prefsFrom(saved: Partial<SchedulePrefs>): SchedulePrefs {
  return {
    mode: saved.mode === 'week' ? 'week' : 'day',
    zoom: saved.zoom === 'work' ? 'work' : 'day',
    workHours: validHours(saved.workHours) ? saved.workHours : DEFAULT_WORK_HOURS,
    sidebarOpen: saved.sidebarOpen !== false,
  }
}

export function loadSchedulePrefs(storage: Pick<Storage, 'getItem'> = window.localStorage): SchedulePrefs {
  try {
    return prefsFrom(readStoredJson<Partial<SchedulePrefs>>(storage, PREFS_STORAGE_KEY) ?? {})
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveSchedulePrefs(prefs: SchedulePrefs, storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  try {
    storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Cambia una hora del horario laboral manteniendo `inicio < fin`. */
export function updateWorkHours(hours: WorkHours, edge: 'start' | 'end', minute: number): WorkHours {
  const next = { ...hours, [edge]: minute }
  if (next.start >= next.end) return edge === 'start' ? { start: minute, end: Math.min(minute + 60, DAY_MINUTES) } : { start: Math.max(minute - 60, 0), end: minute }
  return next
}

// ── Foco: integración con Pomodoro ──────────────────────────

export const FOCUS_STORAGE_KEY = 'pulse.focus'
/** Minutos reales que suma cada bloque de trabajo Pomodoro completado. */
export const FOCUS_SESSION_MINUTES = MODE_DURATIONS_MS.work / MINUTE_MS

/** Bloque del cronograma al que se imputan los Pomodoros completados (o interrumpidos). */
export interface FocusTarget {
  blockId: string
  title: string
  actualMinutes: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const focusTargetFor = (block: TimeBlock): FocusTarget => ({
  blockId: block.id,
  title: block.title,
  actualMinutes: block.actual_duration_minutes,
})

type SavedFocus = Partial<FocusTarget> & Pick<FocusTarget, 'blockId' | 'title'>

const isSavedFocus = (saved: Partial<FocusTarget> | null): saved is SavedFocus =>
  Boolean(saved?.blockId) && typeof saved?.title === 'string'

export function loadFocusTarget(storage: Pick<Storage, 'getItem'> = window.localStorage): FocusTarget | null {
  try {
    const saved = readStoredJson<Partial<FocusTarget>>(storage, FOCUS_STORAGE_KEY)
    return isSavedFocus(saved) ? { blockId: saved.blockId, title: saved.title, actualMinutes: Number(saved.actualMinutes) || 0 } : null
  } catch {
    return null
  }
}

export function saveFocusTarget(target: FocusTarget | null, storage: StorageLike = window.localStorage): void {
  try {
    if (target) storage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(target))
    else storage.removeItem(FOCUS_STORAGE_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Minutos enteros de un bloque de trabajo interrumpido (reiniciado o cambiado de modo). */
export const interruptedFocusMinutes = (elapsedMs: number) => Math.floor(elapsedMs / MINUTE_MS)

export const focusRecordedMessage = (target: FocusTarget, minutes = FOCUS_SESSION_MINUTES) =>
  `Se registraron ${minutes} min reales en «${target.title}».`
