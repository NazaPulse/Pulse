<script setup lang="ts">
import type { FinanceSummary } from '@shared/types'
import ExpenseDonutChart from './charts/ExpenseDonutChart.vue'
import SummaryCards from './charts/SummaryCards.vue'

defineProps<{ summary: FinanceSummary }>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <SummaryCards :summary="summary" />

    <div>
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Egresos por sobre</h2>
      <ExpenseDonutChart :summary="summary" />
    </div>
  </div>
</template>
