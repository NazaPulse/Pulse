<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Fracción completada, de 0 a 1. */
  progress: number
  /** Clase de color del trazo (p. ej. `text-red-500`). */
  colorClass: string
}>()

const SIZE = 280
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
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
        :r="RADIUS"
        fill="none"
        stroke="currentColor"
        :stroke-width="STROKE"
        class="text-slate-200"
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
        :class="[colorClass, 'transition-[stroke-dashoffset] duration-300 ease-linear']"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>
