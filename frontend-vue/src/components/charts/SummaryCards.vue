<script setup lang="ts">
import { computed } from 'vue'

import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

const props = defineProps<{ summary: FinanceSummary }>()

const cards = computed(() => [
  { label: 'Balance total', value: props.summary.total_balance, tone: 'text-slate-900' },
  { label: 'Ingresos', value: props.summary.total_income, tone: 'text-emerald-600' },
  { label: 'Egresos', value: props.summary.total_expenses, tone: 'text-red-600' },
])
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ card.label }}</p>
      <p :class="['mt-1 text-2xl font-semibold tabular-nums', card.tone]">
        {{ currencyFormatter.format(card.value) }}
      </p>
    </div>
  </div>
</template>
