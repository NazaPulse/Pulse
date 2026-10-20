<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ variant: 'error' | 'success' }>()

const STYLES: Record<'error' | 'success', string> = {
  error: 'border-danger/30 bg-danger/10 text-danger-soft',
  success: 'border-ok/30 bg-ok/10 text-ok',
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
