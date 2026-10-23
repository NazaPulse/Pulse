<script setup lang="ts">
import { computed } from 'vue'

import { currencyFormatter } from '@shared/format'
import type { FinanceSummary } from '@shared/types'

import type { IconName } from '@shared/icons'
import Icon from '../Icon.vue'

const props = defineProps<{ summary: FinanceSummary }>()

type Tone = { text: string; chip: string; icon: IconName }

const NEUTRAL: Tone = { text: 'text-fg', chip: 'border-accent/30 bg-accent/10 text-accent', icon: 'scale' }
const INCOME: Tone = {
  text: 'text-chart-green',
  chip: 'border-chart-green/30 bg-chart-green/10 text-chart-green',
  icon: 'arrowUp',
}
const EXPENSE: Tone = {
  text: 'text-chart-pink',
  chip: 'border-chart-pink/30 bg-chart-pink/10 text-chart-pink',
  icon: 'arrowDown',
}

const cards = computed(() => [
  { label: 'Balance total', value: props.summary.total_balance, tone: NEUTRAL },
  { label: 'Ingresos', value: props.summary.total_income, tone: INCOME },
  { label: 'Egresos', value: props.summary.total_expenses, tone: EXPENSE },
])
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div v-for="card in cards" :key="card.label" class="pulse-card animate-rise p-5">
      <div class="flex items-center justify-between">
        <p class="eyebrow text-fg-muted">{{ card.label }}</p>
        <span :class="['grid h-8 w-8 place-items-center rounded-lg border', card.tone.chip]">
          <Icon :name="card.tone.icon" svg-class="h-4 w-4" />
        </span>
      </div>
      <p
        :class="[
          'mt-4 font-display text-3xl font-bold tabular-nums tracking-tight',
          card.tone.text,
        ]"
      >
        {{ currencyFormatter.format(card.value) }}
      </p>
    </div>
  </div>
</template>
