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
  autofocus?: boolean
  maxlength?: number
  step?: string
  min?: string
  inputmode?: 'decimal' | 'numeric' | 'text'
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uid = useId()
const describedBy = computed(() =>
  props.error ? `${uid}-error` : props.hint ? `${uid}-hint` : undefined,
)

const inputClass = computed(() =>
  [
    'w-full rounded-lg border bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition',
    'placeholder:text-fg-dim',
    'focus:ring-2 focus:ring-accent/30 focus:border-accent',
    'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim',
    props.error ? 'border-danger-soft' : 'border-line-strong',
  ].join(' '),
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="uid" class="text-sm font-medium text-fg-soft">
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
      :autofocus="autofocus"
      :maxlength="maxlength"
      :step="step"
      :min="min"
      :inputmode="inputmode"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
      :class="inputClass"
      @input="onInput"
    />
    <p v-if="error" :id="`${uid}-error`" class="text-xs text-danger-soft">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${uid}-hint`" class="text-xs text-fg-muted">
      {{ hint }}
    </p>
  </div>
</template>
