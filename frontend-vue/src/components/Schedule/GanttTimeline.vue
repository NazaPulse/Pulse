<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import * as interactions from '@shared/ganttInteractions'
import type { DragState, TimelineContext } from '@shared/ganttInteractions'
import * as schedule from '@shared/schedule'
import type { BlockSpan, ZoomMode } from '@shared/schedule'
import type { Task, TimeBlock } from '../../types/productivity'
import GanttBlock from './GanttBlock.vue'
import GanttHourRuler from './GanttHourRuler.vue'
import GanttNowLine from './GanttNowLine.vue'
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

const track = ref<HTMLDivElement | null>(null)
const scroller = ref<HTMLDivElement | null>(null)
const drag = ref<DragState | null>(null)
const ghostMinute = ref<number | null>(null)

/** Estado vigente para los manejadores de la grilla (se lee al momento del evento). */
const ctx: TimelineContext = {
  get day() { return props.day },
  get view() { return props.view },
  get blocks() { return props.blocks },
  get placingMinutes() { return props.placingMinutes },
  get drag() { return drag.value },
  callbacks: {
    onPlaceTask: (taskId, minute) => emit('placeTask', taskId, minute),
    onCreateSpan: (span) => emit('createSpan', span),
    onCommitSpan: (block, span) => emit('commitSpan', block, span),
    onOpen: (block) => emit('open', block),
    onFocus: (block) => emit('focus', block),
    onDelete: (block) => emit('delete', block),
  },
  setDrag: (next) => (drag.value = next),
  setGhostMinute: (minute) => (ghostMinute.value = minute),
  trackRect: () => track.value?.getBoundingClientRect() ?? { left: 0, width: 1 },
}

/** Al montar (una vez por día y zoom: la grilla se remonta) se desplaza hasta "ahora". */
onMounted(() => {
  const container = scroller.value
  if (!container || props.zoom !== 'day') return
  const minute = schedule.initialScrollMinute(props.nowMinute, props.blocks, props.day)
  container.scrollLeft = (minute / schedule.DAY_MINUTES) * container.scrollWidth
})

const ghost = computed(() => interactions.ghostSpan(drag.value, ghostMinute.value, props.placingMinutes))
const visibleBlocks = computed(() =>
  props.blocks.filter((block) => schedule.isVisible(schedule.blockSpan(block, props.day), props.view)),
)
const grid = computed(() => schedule.gridStyle(props.view, props.zoom))
const showNow = computed(
  () => props.nowMinute !== null && props.nowMinute >= props.view.start && props.nowMinute <= props.view.end,
)
</script>

<template>
  <div ref="scroller" class="overflow-x-auto">
    <div class="relative px-4 pb-4" :style="{ minWidth: grid.minWidth }">
      <GanttHourRuler :view="view" />

      <div
        ref="track"
        :class="['relative touch-none', placingMinutes !== null ? 'cursor-copy' : 'cursor-crosshair']"
        :style="{
          backgroundImage: grid.backgroundImage,
          backgroundSize: grid.backgroundSize,
          height: `${layout.laneCount * LANE_HEIGHT + 12}px`,
        }"
        @pointerdown="interactions.startCreateDrag(ctx, $event)"
        @pointermove="interactions.moveDrag(ctx, $event)"
        @pointerup="interactions.endDrag(ctx)"
        @pointercancel="drag = null"
        @pointerleave="!drag && (ghostMinute = null)"
        @dragover="interactions.handleDragOver(ctx, $event)"
        @dragleave="ghostMinute = null"
        @drop="interactions.handleDrop(ctx, $event)"
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
          :span="interactions.displayedSpan(drag, block, day)"
          :view="view"
          :lane="layout.lanes.get(block.id) ?? 0"
          :conflict="conflicts.has(block.id)"
          :past-deadline="schedule.isPastDeadline(block, tasksById)"
          :dragging="interactions.isDraggingBlock(drag, block)"
          @drag-start="(mode, event) => interactions.startBlockDrag(ctx, block, mode, event)"
          @block-keydown="(event) => interactions.handleBlockKey(ctx, block, event)"
          @focus-pomodoro="emit('focus', block)"
          @delete="emit('delete', block)"
        />

        <GanttNowLine
          v-if="showNow && nowMinute !== null"
          :minute="nowMinute"
          :left="schedule.minuteToPercent(nowMinute, view)"
        />
      </div>
    </div>
  </div>
</template>
