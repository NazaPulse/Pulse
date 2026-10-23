<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  modelValue: string
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uid = useId()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="uid" class="text-sm font-medium text-fg-soft">{{ label }}</label>
    <select
      :id="uid"
      :value="modelValue"
      :disabled="disabled"
      class="w-full rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim"
      @change="onChange"
    >
      <slot />
    </select>
  </div>
</template>
