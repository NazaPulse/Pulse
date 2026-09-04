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
      'text-sm font-semibold text-white shadow-sm transition',
      'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:bg-indigo-300',
    ]"
  >
    <template v-if="loading">
      <Spinner svg-class="h-4 w-4" />
      {{ loadingLabel }}
    </template>
    <slot v-else />
  </button>
</template>
