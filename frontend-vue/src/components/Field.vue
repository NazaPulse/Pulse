<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  modelValue: string
  label: string
  type?: string
  name?: string
  placeholder?: string
  autocomplete?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  maxlength?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uid = useId()
const describedBy = computed(() =>
  props.error ? `${uid}-error` : props.hint ? `${uid}-hint` : undefined,
)

const inputClass = computed(() =>
  [
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition',
    'placeholder:text-slate-400',
    'focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
    props.error ? 'border-red-400' : 'border-slate-300',
  ].join(' '),
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="uid" class="text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <input
      :id="uid"
      :type="type ?? 'text'"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
      :class="inputClass"
      @input="onInput"
    />
    <p v-if="error" :id="`${uid}-error`" class="text-xs text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${uid}-hint`" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
