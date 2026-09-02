<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ variant: 'error' | 'success' }>()

const STYLES: Record<'error' | 'success', string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const classes = computed(
  () => `rounded-lg border px-3.5 py-2.5 text-sm ${STYLES[props.variant]}`,
)
const role = computed(() => (props.variant === 'error' ? 'alert' : 'status'))
</script>

<template>
  <div :role="role" :class="classes">
    <slot />
  </div>
</template>
