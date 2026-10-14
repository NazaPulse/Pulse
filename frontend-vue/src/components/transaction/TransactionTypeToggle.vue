<script setup lang="ts">
import type { TransactionType } from '@shared/types'
import { TYPE_OPTIONS } from '@shared/utils/transactionForm'

defineProps<{ disabled: boolean }>()
const model = defineModel<TransactionType>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-sm font-medium text-slate-700">Tipo</span>
    <div class="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup">
      <button
        v-for="option in TYPE_OPTIONS"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="model === option.value"
        :disabled="disabled"
        :class="[
          'rounded-md px-3 py-2 text-sm font-semibold transition',
          model === option.value ? option.active : 'text-slate-600 hover:text-slate-900',
        ]"
        @click="model = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
