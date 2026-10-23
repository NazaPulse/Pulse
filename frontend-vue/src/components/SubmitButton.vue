<script setup lang="ts">
import Spinner from './Spinner.vue'

withDefaults(
  defineProps<{
    loading: boolean
    disabled: boolean
    loadingLabel?: string
  }>(),
  { loadingLabel: 'Procesando…' },
)
</script>

<template>
  <button
    type="submit"
    :disabled="disabled || loading"
    :class="[
      'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
      'text-sm font-semibold text-ink transition',
      'bg-accent shadow-glow hover:bg-accent-hover active:bg-accent-strong',
      'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-canvas',
      'disabled:cursor-not-allowed disabled:bg-accent/30 disabled:text-ink/50 disabled:shadow-none',
    ]"
  >
    <template v-if="loading">
      <Spinner svg-class="h-4 w-4" />
      {{ loadingLabel }}
    </template>
    <slot v-else />
  </button>
</template>
