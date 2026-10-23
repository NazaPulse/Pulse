<script setup lang="ts">
import type { TransactionType } from '@shared/types'
import { TYPE_OPTIONS } from '@shared/utils/transactionForm'

defineProps<{ disabled: boolean }>()
const model = defineModel<TransactionType>({ required: true })

/** Estilo del segmento activo: neón verde para ingresos, rosa para egresos. */
const ACTIVE_STYLES: Record<TransactionType, string> = {
  income: 'bg-ok text-ink shadow-[0_0_14px_-2px_rgb(52_211_153/0.7)]',
  expense: 'bg-danger-soft text-ink shadow-[0_0_14px_-2px_rgb(251_113_133/0.7)]',
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-sm font-medium text-fg-soft">Tipo</span>
    <div class="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
      <button
        v-for="option in TYPE_OPTIONS"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="model === option.value"
        :disabled="disabled"
        :class="[
          'rounded-md px-3 py-2 text-sm font-semibold transition',
          model === option.value ? ACTIVE_STYLES[option.value] : 'text-fg-soft hover:text-fg',
        ]"
        @click="model = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
