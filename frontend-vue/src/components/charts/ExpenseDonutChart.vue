<script setup lang="ts">
import { computed, ref } from 'vue'

import type { FinanceSummary } from '@shared/types'
import { buildDonutSlices, findActive, isEmptyBreakdown } from '@shared/utils/donutChart'
import DonutLegend from './DonutLegend.vue'
import DonutRing from './DonutRing.vue'

const props = defineProps<{ summary: FinanceSummary }>()

const activeId = ref<string | null>(null)
const isEmpty = computed(() => isEmptyBreakdown(props.summary.by_category))
const slices = computed(() => buildDonutSlices(props.summary.by_category))
const active = computed(() => findActive(props.summary.by_category, activeId.value))
</script>

<template>
  <div
    v-if="isEmpty"
    class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500"
  >
    Todavía no hay egresos registrados para mostrar el desglose por sobre.
  </div>

  <div
    v-else
    class="flex flex-col items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start"
  >
    <DonutRing
      v-model:active-id="activeId"
      :slices="slices"
      :active="active"
      :total-expenses="summary.total_expenses"
    />
    <DonutLegend v-model:active-id="activeId" :slices="slices" />
  </div>
</template>
