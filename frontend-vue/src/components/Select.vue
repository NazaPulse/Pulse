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
    <label :for="uid" class="text-sm font-medium text-slate-700">{{ label }}</label>
    <select
      :id="uid"
      :value="modelValue"
      :disabled="disabled"
      class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      @change="onChange"
    >
      <slot />
    </select>
  </div>
</template>
