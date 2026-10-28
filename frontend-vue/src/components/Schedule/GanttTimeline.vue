<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import * as schedule from '@shared/schedule'
import type { BlockSpan, DragMode, ZoomMode } from '@shared/schedule'
import type { Task, TimeBlock } from '../../types/productivity'
import GanttBlock from './GanttBlock.vue'
import { LANE_HEIGHT } from './lane'

/**
 * Grilla horizontal con línea de tiempo en vivo. Alta por drag & drop de tareas, por "tocar y
 * ubicar" (táctil) o arrastrando sobre el vacío; bloques editables con imán y teclado.
 */
const props = defineProps<{
  day: Date
  view: BlockSpan
  zoom: ZoomMode
  blocks: TimeBlock[]
  conflicts: ReadonlySet<string>
  layout: { lanes: Map<string, number>; laneCount: number }
  tasksById: ReadonlyMap<string, Task>
  nowMinute: number | null
  /** Duración de la tarea elegida para "tocar y ubicar"; `null` si no hay ninguna. */
  placingMinutes: number | null
}>()
const emit = defineEmits<{
  /** `taskId` es `null` cuando se ubica la tarea elegida con "tocar y ubicar". */
  placeTask: [taskId: string | null, minute: number]
  createSpan: [span: BlockSpan]
  commitSpan: [block: TimeBlock, span: BlockSpan]
  open: [block: TimeBlock]
  focus: [block: TimeBlock]
  delete: [block: TimeBlock]
}>()

/** Arrastre en curso: de un bloque (mover/redimensionar) o sobre el vacío (crear un tramo). */
type DragState =
  | { kind: 'block'; block: TimeBlock; mode: DragMode; originX: number; origin: BlockSpan; preview: BlockSpan; moved: boolean }
  | { kind: 'create'; originX: number; anchor: number; preview: BlockSpan; moved: boolean }

const track = ref<HTMLDivElement | null>(null)
const scroller = ref<HTMLDivElement | null>(null)
const drag = ref<DragState | null>(null)
const ghostMinute = ref<number | null>(null)

function trackRect() {
  return track.value?.getBoundingClientRect() ?? { left: 0, width: 1 }
}

/** Al montar (una vez por día y zoom: la grilla se remonta) se desplaza hasta "ahora". */
onMounted(() => {
  const container = scroller.value
  if (!container || props.zoom !== 'day') return
  const minute = schedule.initialScrollMinute(props.nowMinute, props.blocks, props.day)
  container.scrollLeft = (minute / schedule.DAY_MINUTES) * container.scrollWidth
})

const otherSpans = (block: TimeBlock) =>
  props.blocks.filter((other) => other.id !== block.id).map((other) => schedule.blockSpan(other, props.day))

function startBlockDrag(block: TimeBlock, mode: DragMode, event: PointerEvent) {
  if (event.button !== 0) return
  event.stopPropagation()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  const origin = schedule.blockSpan(block, props.day)
  drag.value = { kind: 'block', block, mode, originX: event.clientX, origin, preview: origin, moved: false }
}

function startCreateDrag(event: PointerEvent) {
  if (event.button !== 0 || event.target !== event.currentTarget) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  const anchor = schedule.minuteAtPointer(event.clientX, trackRect(), props.view)
  const preview = { start: anchor, end: anchor + schedule.MIN_BLOCK_MINUTES }
  drag.value = { kind: 'create', originX: event.clientX, anchor, preview, moved: false }
}

function moveDrag(event: PointerEvent) {
  const current = drag.value
  if (!current) {
    ghostMinute.value =
      props.placingMinutes === null ? null : schedule.minuteAtPointer(event.clientX, trackRect(), props.view)
    return
  }
  const moved = current.moved || Math.abs(event.clientX - current.originX) >= schedule.DRAG_THRESHOLD_PX
  if (current.kind === 'block') {
    const delta = schedule.pixelsToMinutes(event.clientX - current.originX, trackRect().width, props.view)
    const raw = schedule.dragSpan(current.origin, current.mode, delta)
    drag.value = { ...current, moved, preview: schedule.magnetize(raw, current.mode, otherSpans(current.block)) }
    return
  }
  const minute = schedule.minuteAtPointer(event.clientX, trackRect(), props.view)
  const start = Math.min(current.anchor, minute)
  const end = Math.max(current.anchor, minute, start + schedule.MIN_BLOCK_MINUTES)
  drag.value = { ...current, moved, preview: { start, end } }
}

function endDrag() {
  const current = drag.value
  if (!current) return
  drag.value = null
  if (current.kind === 'block') {
    if (!current.moved) emit('open', current.block)
    else if (!schedule.sameSpan(current.origin, current.preview)) emit('commitSpan', current.block, current.preview)
    return
  }
  ghostMinute.value = null
  if (current.moved) emit('createSpan', current.preview)
  else if (props.placingMinutes !== null) emit('placeTask', null, current.anchor)
}

function onPointerLeave() {
  if (!drag.value) ghostMinute.value = null
}

function handleBlockKey(block: TimeBlock, event: KeyboardEvent) {
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('open', block)
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('delete', block)
    return
  }
  const mods = { shift: event.shiftKey, alt: event.altKey }
  const next = schedule.keyboardSpan(schedule.blockSpan(block, props.day), event.key, mods)
  if (!next) return
  event.preventDefault()
  emit('commitSpan', block, next)
}

function acceptsTask(event: DragEvent) {
  return event.dataTransfer?.types.includes(schedule.TASK_DRAG_MIME) ?? false
}

function onDragOver(event: DragEvent) {
  if (!acceptsTask(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  ghostMinute.value = schedule.minuteAtPointer(event.clientX, trackRect(), props.view)
}

function onDrop(event: DragEvent) {
  if (!acceptsTask(event)) return
  event.preventDefault()
  ghostMinute.value = null
  const taskId = event.dataTransfer?.getData(schedule.TASK_DRAG_MIME) ?? ''
  emit('placeTask', taskId, schedule.minuteAtPointer(event.clientX, trackRect(), props.view))
}

const ghost = computed<BlockSpan | null>(() => {
  if (drag.value?.kind === 'create') return drag.value.preview
  if (ghostMinute.value === null) return null
  const length = props.placingMinutes ?? schedule.DEFAULT_DROP_MINUTES
  return { start: ghostMinute.value, end: Math.min(ghostMinute.value + length, schedule.DAY_MINUTES) }
})

const visibleBlocks = computed(() =>
  props.blocks.filter((block) => schedule.isVisible(schedule.blockSpan(block, props.day), props.view)),
)
const marks = computed(() => schedule.hourMarks(props.view))
const grid = computed(() => schedule.gridStyle(props.view, props.zoom))
const showNow = computed(
  () => props.nowMinute !== null && props.nowMinute >= props.view.start && props.nowMinute <= props.view.end,
)

const isDragging = (block: TimeBlock) => drag.value?.kind === 'block' && drag.value.block.id === block.id
function spanOf(block: TimeBlock) {
  const current = drag.value
  return current?.kind === 'block' && current.block.id === block.id ? current.preview : schedule.blockSpan(block, props.day)
}

function markClass(minute: number) {
  if (minute === props.view.end) return '-translate-x-full'
  return minute === props.view.start ? '' : '-translate-x-1/2'
}
</script>

<template>
  <div ref="scroller" class="overflow-x-auto">
    <div class="relative px-4 pb-4" :style="{ minWidth: grid.minWidth }">
      <div class="relative h-8 border-b border-line">
        <span
          v-for="minute in marks"
          :key="minute"
          :class="['absolute top-2 font-mono text-[0.625rem] text-fg-dim', markClass(minute)]"
          :style="{ left: schedule.minuteToPercent(minute, view) }"
        >
          {{ schedule.formatMinute(minute) }}
        </span>
      </div>

      <div
        ref="track"
        :class="['relative touch-none', placingMinutes !== null ? 'cursor-copy' : 'cursor-crosshair']"
        :style="{
          backgroundImage: grid.backgroundImage,
          backgroundSize: grid.backgroundSize,
          height: `${layout.laneCount * LANE_HEIGHT + 12}px`,
        }"
        @pointerdown="startCreateDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="drag = null"
        @pointerleave="onPointerLeave"
        @dragover="onDragOver"
        @dragleave="ghostMinute = null"
        @drop="onDrop"
      >
        <p
          v-if="visibleBlocks.length === 0 && !ghost"
          class="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-fg-dim"
        >
          Sin bloques. Arrastrá sobre la grilla para crear uno o soltá una tarea.
        </p>

        <div
          v-if="ghost"
          class="pointer-events-none absolute z-0 flex items-center justify-center rounded-lg border border-dashed border-accent/70 bg-accent/10 font-mono text-[0.625rem] text-accent"
          :style="{ ...schedule.spanStyle(ghost, view), top: '6px', height: `${LANE_HEIGHT - 10}px` }"
          aria-hidden="true"
        >
          {{ schedule.spanLabel(ghost) }}
        </div>

        <GanttBlock
          v-for="block in visibleBlocks"
          :key="block.id"
          :block="block"
          :span="spanOf(block)"
          :view="view"
          :lane="layout.lanes.get(block.id) ?? 0"
          :conflict="conflicts.has(block.id)"
          :past-deadline="schedule.isPastDeadline(block, tasksById)"
          :dragging="isDragging(block)"
          @drag-start="(mode, event) => startBlockDrag(block, mode, event)"
          @block-keydown="(event) => handleBlockKey(block, event)"
          @focus-pomodoro="emit('focus', block)"
          @delete="emit('delete', block)"
        />

        <div
          v-if="showNow && nowMinute !== null"
          class="pointer-events-none absolute -top-8 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-accent shadow-glow-sm"
          :style="{ left: schedule.minuteToPercent(nowMinute, view) }"
          aria-hidden="true"
        >
          <span
            class="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 animate-blink rounded-full bg-accent shadow-glow-sm"
          />
          <span
            class="absolute left-2 top-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold text-ink"
          >
            {{ schedule.formatMinute(nowMinute) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
