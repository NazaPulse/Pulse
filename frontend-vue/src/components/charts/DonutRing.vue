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
  <div class="relative h-52 w-52 shrink-0">
    <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90" role="img" aria-label="Egresos por sobre">
      <circle
        cx="80"
        cy="80"
        :r="RADIUS + 14"
        fill="none"
        stroke="#7B8AA0"
        stroke-opacity=".35"
        stroke-width="1"
        stroke-dasharray="1 5"
      />
      <circle cx="80" cy="80" :r="RADIUS" fill="none" stroke="#1E293B" :stroke-width="STROKE" />
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
          opacity: activeId !== null && activeId !== slice.category.category_id ? 0.3 : 1,
          filter:
            activeId === slice.category.category_id
              ? `drop-shadow(0 0 5px ${slice.color})`
              : undefined,
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
      <span class="eyebrow max-w-[7.5rem] truncate !tracking-[0.1em] text-fg-muted">
        {{ active ? active.category_name : 'Total egresos' }}
      </span>
      <span class="mt-1 font-display text-lg font-bold tabular-nums text-fg">
        {{ currencyFormatter.format(active ? active.total_amount : totalExpenses) }}
      </span>
      <span v-if="active" class="text-xs text-accent">{{ active.percentage }}%</span>
    </div>
  </div>
</template>
