<script setup lang="ts">
import { ICON_PATHS } from '@shared/icons'
import type { IconName } from '@shared/icons'

/** Ícono de trazo (24×24) que hereda el color del texto (`currentColor`). */
withDefaults(defineProps<{ name: IconName; svgClass?: string; strokeWidth?: number }>(), {
  svgClass: 'h-5 w-5',
  strokeWidth: 1.7,
})
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="svgClass"
    aria-hidden="true"
  >
    <path :d="ICON_PATHS[name]" />
  </svg>
</template>
