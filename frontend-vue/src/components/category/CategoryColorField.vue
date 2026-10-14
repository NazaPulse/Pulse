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
    <label class="text-sm font-medium text-slate-700" for="category-color-vue">Color</label>
    <div class="flex items-center gap-3">
      <input
        id="category-color-vue"
        type="color"
        :value="colorPickerValue"
        :disabled="disabled"
        class="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        @input="onInput"
      />
      <input
        type="text"
        :value="model"
        :disabled="disabled"
        placeholder="#6B7280"
        maxlength="7"
        :class="[
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition',
          'focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
          isColorValid ? 'border-slate-300' : 'border-red-400',
        ]"
        @input="onInput"
      />
    </div>
    <p v-if="!isColorValid" class="text-xs text-red-600">Formato esperado: #RRGGBB</p>
  </div>
</template>
