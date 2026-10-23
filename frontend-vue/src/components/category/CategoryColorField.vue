<script setup lang="ts">
import { computed } from 'vue'

import { isValidHexColor } from '@shared/validation'
import { DEFAULT_COLOR } from '@shared/utils/categoryForm'

defineProps<{ disabled: boolean }>()
const model = defineModel<string>({ required: true })

const isColorValid = computed(() => isValidHexColor(model.value))
const colorPickerValue = computed(() => (isColorValid.value ? model.value : DEFAULT_COLOR))

function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium text-fg-soft" for="category-color-vue">Color</label>
    <div class="flex items-center gap-3">
      <input
        id="category-color-vue"
        type="color"
        :value="colorPickerValue"
        :disabled="disabled"
        class="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
        @input="onInput"
      />
      <input
        type="text"
        :value="model"
        :disabled="disabled"
        placeholder="#6B7280"
        maxlength="7"
        :class="[
          'w-full rounded-lg border bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition',
          'focus:ring-2 focus:ring-accent/30 focus:border-accent',
          'disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-fg-dim',
          isColorValid ? 'border-line-strong' : 'border-danger-soft',
        ]"
        @input="onInput"
      />
    </div>
    <p v-if="!isColorValid" class="text-xs text-danger-soft">Formato esperado: #RRGGBB</p>
  </div>
</template>
