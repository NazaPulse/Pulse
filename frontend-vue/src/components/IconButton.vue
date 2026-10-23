<script setup lang="ts">
import type { IconName } from '@shared/icons'
import Icon from './Icon.vue'

const TONES = {
  default: 'hover:bg-white/10 hover:text-accent',
  danger: 'hover:bg-danger/10 hover:text-danger-soft',
}

/** Botón cuadrado con solo un ícono (acciones de fila: editar, eliminar). */
withDefaults(defineProps<{ icon: IconName; label: string; tone?: keyof typeof TONES }>(), {
  tone: 'default',
})
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :class="['rounded-lg p-2 text-fg-dim transition', TONES[tone]]"
  >
    <Icon :name="icon" svg-class="h-4 w-4" :stroke-width="1.7" />
  </button>
</template>
