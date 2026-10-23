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

const clamped = computed(() => Math.min(1, Math.max(0, props.progress)))
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
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS + STROKE / 2 + 7"
        fill="none"
        stroke="#7B8AA0"
        stroke-opacity=".4"
        stroke-width="1.5"
        stroke-dasharray="1 7"
        stroke-linecap="round"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        stroke="currentColor"
        :stroke-width="STROKE"
        class="text-line-strong"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        stroke="currentColor"
        :stroke-width="STROKE"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="CIRCUMFERENCE * (1 - clamped)"
        :class="[
          colorClass,
          'drop-shadow-[0_0_8px_currentColor] transition-[stroke-dashoffset] duration-300 ease-linear',
        ]"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>
