<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Fracción completada, de 0 a 1. */
  progress: number
  /** Clase de color del trazo (p. ej. `text-danger-soft`). */
  colorClass: string
}>()

const SIZE = 280
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2 - 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

const clamped = computed(() => Math.min(1, Math.max(0, props.progress)))
const offset = computed(() => CIRCUMFERENCE * (1 - clamped.value))
</script>

<template>
  <div class="relative mx-auto aspect-square w-full max-w-[280px]">
    <svg
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      class="h-full w-full -rotate-90"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(clamped * 100)"
    >
      <g fill="none">
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS + STROKE / 2 + 7"
          stroke="#7B8AA0"
          stroke-opacity=".4"
          stroke-width="1.5"
          stroke-dasharray="1 7"
          stroke-linecap="round"
        />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          stroke="currentColor"
          :stroke-width="STROKE"
          class="text-line-strong"
        />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          stroke="currentColor"
          :stroke-width="STROKE"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="offset"
          :class="[
            colorClass,
            'drop-shadow-[0_0_8px_currentColor] transition-[stroke-dashoffset] duration-300 ease-linear',
          ]"
        />
      </g>
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>
