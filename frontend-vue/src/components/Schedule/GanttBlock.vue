<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

import * as schedule from '@shared/schedule'
import type { BlockSpan, DragMode } from '@shared/schedule'
import type { TimeBlock } from '../../types/productivity'
import Icon from '../Icon.vue'
import { LANE_HEIGHT } from './lane'

/**
 * Bloque de la grilla: fondo translúcido = tiempo planificado, barra sólida inferior = minutos
 * reales. Clic = editar; bordes redimensionables, cuerpo arrastrable (con imán) y flechas del
 * teclado. Borde rojo si hay conflicto; aviso si termina después del vencimiento de su tarea.
 * Un borde punteado indica que el bloque sigue fuera de la ventana visible (medianoche o zoom).
 */
const props = defineProps<{
  block: TimeBlock
  span: BlockSpan
  view: BlockSpan
  lane: number
  conflict: boolean
  pastDeadline: boolean
  dragging: boolean
}>()
defineEmits<{
  dragStart: [mode: DragMode, event: PointerEvent]
  blockKeydown: [event: KeyboardEvent]
  focusPomodoro: []
  delete: []
}>()

const colors = computed(() => schedule.blockColors(props.block.category, props.conflict))
const ratio = computed(() => schedule.actualRatio(props.block))
const clipped = computed(() => schedule.clippedEdges(props.span, props.view))
const spanText = computed(() => schedule.spanLabel(props.span))
const progressText = computed(() => schedule.progressLabel(props.block))
const blockStyle = computed<CSSProperties>(() => ({
  ...schedule.spanStyle(props.span, props.view),
  top: `${props.lane * LANE_HEIGHT + 6}px`,
  height: `${LANE_HEIGHT - 10}px`,
  ...colors.value.planned,
  ...(clipped.value.before ? { borderLeftStyle: 'dashed', borderTopLeftRadius: '0', borderBottomLeftRadius: '0' } : {}),
  ...(clipped.value.after ? { borderRightStyle: 'dashed', borderTopRightRadius: '0', borderBottomRightRadius: '0' } : {}),
}))
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="`${block.title}, ${spanText}. Enter para editar, flechas para mover (Shift: fin, Alt: inicio), Suprimir para eliminar.`"
    :class="[
      'group absolute touch-none select-none overflow-hidden rounded-lg border backdrop-blur-sm transition-shadow focus-visible:ring-2 focus-visible:ring-accent',
      dragging ? 'z-20 opacity-90' : 'z-10',
      block.is_completed ? 'opacity-60' : '',
    ]"
    :style="blockStyle"
    :title="`${block.title} · ${spanText} · ${progressText}`"
    @keydown="$emit('blockKeydown', $event)"
  >
    <div
      class="flex h-full cursor-grab flex-col gap-0.5 px-3 pb-3 pt-1.5 active:cursor-grabbing"
      @pointerdown="$emit('dragStart', 'move', $event)"
    >
      <p :class="['truncate text-xs font-semibold text-fg', block.is_completed ? 'line-through' : '']">
        {{ block.title }}
      </p>
      <p class="truncate font-mono text-[0.625rem] text-fg-muted">
        {{ spanText }}
        <span v-if="conflict" class="ml-1.5 font-semibold text-danger-soft">· Conflicto</span>
        <span v-if="pastDeadline" class="ml-1.5 font-semibold text-warn">· Después del vencimiento</span>
      </p>
      <p class="truncate font-mono text-[0.625rem] text-fg-dim">{{ progressText }}</p>
    </div>

    <div
      class="absolute right-1 top-1 flex gap-0.5 rounded-md bg-canvas/90 p-0.5 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100"
    >
      <!-- `.stop` evita que un clic en los botones inicie un arrastre del bloque. -->
      <button
        type="button"
        :aria-label="`Enfocar ${block.title} en el Pomodoro`"
        title="Enfocar (Pomodoro)"
        class="shrink-0 rounded-md border border-accent/40 bg-accent/10 p-0.5 text-accent transition hover:bg-accent hover:text-ink"
        @pointerdown.stop
        @click="$emit('focusPomodoro')"
      >
        <Icon name="focus" svg-class="h-3.5 w-3.5" :stroke-width="2" />
      </button>
      <button
        type="button"
        :aria-label="`Eliminar ${block.title}`"
        class="shrink-0 rounded-md p-0.5 text-fg-dim transition hover:bg-danger/10 hover:text-danger-soft"
        @pointerdown.stop
        @click="$emit('delete')"
      >
        <Icon name="close" svg-class="h-3.5 w-3.5" />
      </button>
    </div>

    <div class="absolute inset-x-0 bottom-0 h-1.5 bg-white/5" aria-hidden="true">
      <div
        class="h-full rounded-r-full transition-[width] duration-500"
        :style="{ width: `${ratio * 100}%`, ...colors.actual }"
      />
    </div>

    <span
      v-if="!clipped.before"
      aria-hidden="true"
      class="absolute inset-y-0 left-0 w-2 cursor-ew-resize hover:bg-white/20"
      @pointerdown="$emit('dragStart', 'start', $event)"
    />
    <span
      v-if="!clipped.after"
      aria-hidden="true"
      class="absolute inset-y-0 right-0 w-2 cursor-ew-resize hover:bg-white/20"
      @pointerdown="$emit('dragStart', 'end', $event)"
    />
  </div>
</template>
