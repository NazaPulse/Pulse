<script setup lang="ts">
import { currencyFormatter } from '@shared/format'
import type { CategorySummary } from '@shared/types'
import { RADIUS, STROKE } from '@shared/utils/donutChart'
import type { DonutSlice } from '@shared/utils/donutChart'

defineProps<{ slices: DonutSlice[]; active: CategorySummary | null; totalExpenses: number }>()
const activeId = defineModel<string | null>('activeId', { required: true })

function toggle(id: string) {
  activeId.value = activeId.value === id ? null : id
}
</script>

<template>
  <div class="relative h-48 w-48 shrink-0">
    <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90" role="img" aria-label="Egresos por sobre">
      <circle cx="80" cy="80" :r="RADIUS" fill="none" stroke="#F1F5F9" :stroke-width="STROKE" />
      <circle
        v-for="slice in slices"
        :key="slice.category.category_id"
        cx="80"
        cy="80"
        :r="RADIUS"
        fill="none"
        :stroke="slice.color"
        :stroke-width="activeId === slice.category.category_id ? STROKE + 4 : STROKE"
        :stroke-dasharray="slice.dasharray"
        :stroke-dashoffset="slice.offset"
        class="cursor-pointer transition-all duration-200"
        :style="{
          opacity: activeId !== null && activeId !== slice.category.category_id ? 0.35 : 1,
        }"
        @mouseenter="activeId = slice.category.category_id"
        @mouseleave="activeId = null"
        @click="toggle(slice.category.category_id)"
      >
        <title>
          {{ `${slice.category.category_name}: ${currencyFormatter.format(slice.category.total_amount)}` }}
        </title>
      </circle>
    </svg>
    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <span class="max-w-[7rem] truncate text-xs text-slate-500">
        {{ active ? active.category_name : 'Total egresos' }}
      </span>
      <span class="text-base font-semibold tabular-nums text-slate-900">
        {{ currencyFormatter.format(active ? active.total_amount : totalExpenses) }}
      </span>
      <span v-if="active" class="text-xs text-slate-500">{{ active.percentage }}%</span>
    </div>
  </div>
</template>
