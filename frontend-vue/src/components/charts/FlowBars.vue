<script setup lang="ts">
import { computed } from 'vue'

import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

const props = defineProps<{ summary: FinanceSummary }>()

const max = computed(() => Math.max(props.summary.total_income, props.summary.total_expenses))
const ratio = computed(() =>
  props.summary.total_income > 0
    ? Math.round((props.summary.total_expenses / props.summary.total_income) * 100)
    : null,
)

function barWidth(value: number): number {
  return max.value > 0 ? Math.max((value / max.value) * 100, value > 0 ? 3 : 0) : 0
}

/** Barras comparativas ingresos vs. egresos (misma escala). */
const bars = computed(() => [
  { label: 'Ingresos', value: props.summary.total_income, color: '#86E3AE' },
  { label: 'Egresos', value: props.summary.total_expenses, color: '#FF9FC5' },
])
</script>

<template>
  <div class="pulse-card flex h-full flex-col gap-6 p-5">
    <div v-for="bar in bars" :key="bar.label">
      <div class="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span class="text-fg-soft">{{ bar.label }}</span>
        <span class="font-display font-semibold tabular-nums text-fg">
          {{ currencyFormatter.format(bar.value) }}
        </span>
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full transition-[width] duration-700 ease-out"
          :style="{
            width: `${barWidth(bar.value)}%`,
            background: `linear-gradient(90deg, ${bar.color}66, ${bar.color})`,
            boxShadow: `0 0 12px ${bar.color}88`,
          }"
        />
      </div>
    </div>
    <p class="mt-auto border-t border-line pt-4 text-xs text-fg-muted">
      {{
        ratio === null
          ? 'Cargá ingresos para ver qué parte se va en egresos.'
          : `Los egresos equivalen al ${ratio}% de tus ingresos.`
      }}
    </p>
  </div>
</template>
