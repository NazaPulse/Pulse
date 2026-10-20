<script setup lang="ts">
import { computed, ref } from 'vue'

import type { FinanceSummary } from '@shared/types'
import { buildDonutSlices, findActive, isEmptyBreakdown } from '@shared/utils/donutChart'
import { chartColor } from '../../lib/chartPalette'
import DonutLegend from './DonutLegend.vue'
import DonutRing from './DonutRing.vue'

const props = defineProps<{ summary: FinanceSummary }>()

const activeId = ref<string | null>(null)
const isEmpty = computed(() => isEmptyBreakdown(props.summary.by_category))
// Paleta pastel de Pulse para los sobres sin color propio.
const slices = computed(() =>
  buildDonutSlices(props.summary.by_category).map((slice, index) => ({
    ...slice,
    color: chartColor(slice.color, index),
  })),
)
const active = computed(() => findActive(props.summary.by_category, activeId.value))
</script>

<template>
  <div v-if="isEmpty" class="pulse-empty px-4 py-10 text-center text-sm text-fg-muted">
    Todavía no hay egresos registrados para mostrar el desglose por sobre.
  </div>

  <div v-else class="pulse-card flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center">
    <DonutRing
      v-model:active-id="activeId"
      :slices="slices"
      :active="active"
      :total-expenses="summary.total_expenses"
    />
    <DonutLegend v-model:active-id="activeId" :slices="slices" />
  </div>
</template>
