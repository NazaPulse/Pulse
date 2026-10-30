// Interacción con la grilla del Cronograma (arrastrar, soltar tareas y teclado), independiente del
// framework: cada frontend conecta los eventos del DOM y sus callbacks.
import * as schedule from './schedule'
import type { BlockSpan, DragMode } from './schedule'
import type { TimeBlock } from './types'

/** Lo que se usa de un `PointerEvent` (nativo o sintético). */
export interface PointerLike {
  button: number
  clientX: number
  pointerId: number
  target: unknown
  currentTarget: unknown
  stopPropagation(): void
}

/** Lo que se usa de un `KeyboardEvent` (nativo o sintético). */
export interface KeyLike {
  key: string
  shiftKey: boolean
  altKey: boolean
  target: unknown
  currentTarget: unknown
  preventDefault(): void
}

/** Lo que se usa de un `DragEvent` (nativo o sintético). */
export interface DragLike {
  clientX: number
  dataTransfer: DataTransfer | null
  preventDefault(): void
}

/** Arrastre en curso: de un bloque (mover/redimensionar) o sobre el vacío (crear un tramo). */
export type DragState =
  | {
      kind: 'block'
      block: TimeBlock
      mode: DragMode
      originX: number
      origin: BlockSpan
      preview: BlockSpan
      moved: boolean
    }
  | { kind: 'create'; originX: number; anchor: number; preview: BlockSpan; moved: boolean }

type BlockDrag = Extract<DragState, { kind: 'block' }>

/** Callbacks de la grilla hacia la página. */
export type TimelineCallbacks = {
  /** `taskId` es `null` cuando se ubica la tarea elegida con "tocar y ubicar". */
  onPlaceTask: (taskId: string | null, minute: number) => void
  onCreateSpan: (span: BlockSpan) => void
  onCommitSpan: (block: TimeBlock, span: BlockSpan) => void
  onOpen: (block: TimeBlock) => void
  onFocus: (block: TimeBlock) => void
  onDelete: (block: TimeBlock) => void
}

/** Estado y dependencias que comparten los manejadores de la grilla. */
export type TimelineContext = {
  day: Date
  view: BlockSpan
  blocks: TimeBlock[]
  /** Duración de la tarea elegida para "tocar y ubicar"; `null` si no hay ninguna. */
  placingMinutes: number | null
  callbacks: TimelineCallbacks
  drag: DragState | null
  setDrag: (drag: DragState | null) => void
  setGhostMinute: (minute: number | null) => void
  trackRect: () => { left: number; width: number }
}

/** El elemento que recibió el evento sigue recibiendo el puntero aunque salga de él. */
const capturePointer = (event: PointerLike) => (event.currentTarget as Element).setPointerCapture(event.pointerId)

const pointerMinute = (ctx: TimelineContext, clientX: number) =>
  schedule.minuteAtPointer(clientX, ctx.trackRect(), ctx.view)

const otherSpans = (ctx: TimelineContext, block: TimeBlock) =>
  ctx.blocks.filter((other) => other.id !== block.id).map((other) => schedule.blockSpan(other, ctx.day))

export function startBlockDrag(ctx: TimelineContext, block: TimeBlock, mode: DragMode, event: PointerLike) {
  if (event.button !== 0) return
  event.stopPropagation()
  capturePointer(event)
  const origin = schedule.blockSpan(block, ctx.day)
  ctx.setDrag({ kind: 'block', block, mode, originX: event.clientX, origin, preview: origin, moved: false })
}

export function startCreateDrag(ctx: TimelineContext, event: PointerLike) {
  if (event.button !== 0 || event.target !== event.currentTarget) return
  capturePointer(event)
  const anchor = pointerMinute(ctx, event.clientX)
  const preview = { start: anchor, end: anchor + schedule.MIN_BLOCK_MINUTES }
  ctx.setDrag({ kind: 'create', originX: event.clientX, anchor, preview, moved: false })
}

/** Tramo provisorio del arrastre según la posición actual del puntero. */
function dragPreview(ctx: TimelineContext, drag: DragState, clientX: number): BlockSpan {
  if (drag.kind === 'block') {
    const delta = schedule.pixelsToMinutes(clientX - drag.originX, ctx.trackRect().width, ctx.view)
    const raw = schedule.dragSpan(drag.origin, drag.mode, delta)
    return schedule.magnetize(raw, drag.mode, otherSpans(ctx, drag.block))
  }
  const current = pointerMinute(ctx, clientX)
  const start = Math.min(drag.anchor, current)
  return { start, end: Math.max(drag.anchor, current, start + schedule.MIN_BLOCK_MINUTES) }
}

export function moveDrag(ctx: TimelineContext, event: PointerLike) {
  const { drag } = ctx
  if (!drag) {
    ctx.setGhostMinute(ctx.placingMinutes === null ? null : pointerMinute(ctx, event.clientX))
    return
  }
  const moved = drag.moved || Math.abs(event.clientX - drag.originX) >= schedule.DRAG_THRESHOLD_PX
  ctx.setDrag({ ...drag, moved, preview: dragPreview(ctx, drag, event.clientX) })
}

/** Soltar un bloque: sin moverlo es un clic (abre el editor); si cambió el tramo, se guarda. */
function endBlockDrag(ctx: TimelineContext, drag: BlockDrag) {
  if (!drag.moved) ctx.callbacks.onOpen(drag.block)
  else if (!schedule.sameSpan(drag.origin, drag.preview)) ctx.callbacks.onCommitSpan(drag.block, drag.preview)
}

/** Soltar sobre el vacío: crea el tramo arrastrado, o ubica la tarea elegida con un toque. */
function endCreateDrag(ctx: TimelineContext, drag: Extract<DragState, { kind: 'create' }>) {
  ctx.setGhostMinute(null)
  if (drag.moved) ctx.callbacks.onCreateSpan(drag.preview)
  else if (ctx.placingMinutes !== null) ctx.callbacks.onPlaceTask(null, drag.anchor)
}

export function endDrag(ctx: TimelineContext) {
  const { drag } = ctx
  if (!drag) return
  ctx.setDrag(null)
  if (drag.kind === 'block') endBlockDrag(ctx, drag)
  else endCreateDrag(ctx, drag)
}

const OPEN_KEYS = new Set(['Enter', ' '])
const DELETE_KEYS = new Set(['Delete', 'Backspace'])

/** Enter/Espacio editan y Suprimir/Retroceso eliminan; otras teclas no tienen acción directa. */
function keyAction(ctx: TimelineContext, key: string) {
  if (OPEN_KEYS.has(key)) return ctx.callbacks.onOpen
  return DELETE_KEYS.has(key) ? ctx.callbacks.onDelete : null
}

/** Teclado sobre un bloque: Enter/Espacio edita, Suprimir elimina y las flechas lo mueven. */
export function handleBlockKey(ctx: TimelineContext, block: TimeBlock, event: KeyLike) {
  if (event.target !== event.currentTarget) return
  const action = keyAction(ctx, event.key)
  if (action) {
    event.preventDefault()
    action(block)
    return
  }
  const next = schedule.keyboardSpan(schedule.blockSpan(block, ctx.day), event.key, {
    shift: event.shiftKey,
    alt: event.altKey,
  })
  if (!next) return
  event.preventDefault()
  ctx.callbacks.onCommitSpan(block, next)
}

const acceptsTask = (event: DragLike) => event.dataTransfer?.types.includes(schedule.TASK_DRAG_MIME) ?? false

export function handleDragOver(ctx: TimelineContext, event: DragLike) {
  if (!acceptsTask(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  ctx.setGhostMinute(pointerMinute(ctx, event.clientX))
}

export function handleDrop(ctx: TimelineContext, event: DragLike) {
  if (!acceptsTask(event)) return
  event.preventDefault()
  ctx.setGhostMinute(null)
  const minute = pointerMinute(ctx, event.clientX)
  ctx.callbacks.onPlaceTask(event.dataTransfer?.getData(schedule.TASK_DRAG_MIME) ?? '', minute)
}

/** Hay un arrastre en curso de `block`. */
export const isDraggingBlock = (drag: DragState | null, block: TimeBlock): drag is BlockDrag =>
  drag?.kind === 'block' && drag.block.id === block.id

/** Tramo a dibujar: el provisorio mientras se arrastra el bloque; si no, el guardado. */
export function displayedSpan(drag: DragState | null, block: TimeBlock, day: Date): BlockSpan {
  return isDraggingBlock(drag, block) ? drag.preview : schedule.blockSpan(block, day)
}

/** Donde caería una tarea soltada en `minute` (con su duración, o la predeterminada). */
function dropSpan(minute: number, placingMinutes: number | null): BlockSpan {
  const length = placingMinutes ?? schedule.DEFAULT_DROP_MINUTES
  return { start: minute, end: Math.min(minute + length, schedule.DAY_MINUTES) }
}

/** Tramo fantasma: el que se está creando, o donde caería la tarea arrastrada/elegida. */
export function ghostSpan(
  drag: DragState | null,
  ghostMinute: number | null,
  placingMinutes: number | null,
): BlockSpan | null {
  if (drag?.kind === 'create') return drag.preview
  return ghostMinute === null ? null : dropSpan(ghostMinute, placingMinutes)
}
