<script setup lang="ts">
import type { FinanceSummary } from '@shared/types'
import ExpenseDonutChart from './charts/ExpenseDonutChart.vue'
import FlowBars from './charts/FlowBars.vue'
import SummaryCards from './charts/SummaryCards.vue'

defineProps<{ summary: FinanceSummary }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <SummaryCards :summary="summary" />

    <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <h2 class="section-title mb-3">Egresos por sobre</h2>
        <ExpenseDonutChart :summary="summary" />
      </div>
      <div class="flex flex-col">
        <h2 class="section-title mb-3">Flujo de caja</h2>
        <div class="flex-1">
          <FlowBars :summary="summary" />
        </div>
      </div>
    </div>
  </div>
</template>
