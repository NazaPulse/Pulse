<script setup lang="ts">
import { currencyFormatter } from '@shared/format'
import type { DonutSlice } from '@shared/utils/donutChart'

defineProps<{ slices: DonutSlice[] }>()
const activeId = defineModel<string | null>('activeId', { required: true })

function percent(value: number | string): number {
  return Math.min(100, Math.max(0, Number(value)))
}
</script>

<template>
  <ul class="flex w-full flex-col gap-1">
    <li v-for="slice in slices" :key="slice.category.category_id">
      <button
        type="button"
        :class="[
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
          activeId === slice.category.category_id ? 'bg-white/[0.07]' : 'hover:bg-white/5',
        ]"
        @mouseenter="activeId = slice.category.category_id"
        @mouseleave="activeId = null"
        @focus="activeId = slice.category.category_id"
        @blur="activeId = null"
      >
        <span
          class="h-3 w-3 shrink-0 rounded-full"
          :style="{ backgroundColor: slice.color, boxShadow: `0 0 8px ${slice.color}` }"
        />
        <span class="min-w-0 flex-1">
          <span class="flex items-center justify-between gap-3">
            <span class="truncate text-fg-soft">{{ slice.category.category_name }}</span>
            <span class="font-mono text-xs tabular-nums text-fg-muted">
              {{ slice.category.percentage }}%
            </span>
          </span>
          <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
            <span
              class="block h-full rounded-full"
              :style="{
                width: `${percent(slice.category.percentage)}%`,
                backgroundColor: slice.color,
                boxShadow: `0 0 8px ${slice.color}99`,
              }"
            />
          </span>
        </span>
        <span class="w-28 text-right font-display font-semibold tabular-nums text-fg">
          {{ currencyFormatter.format(slice.category.total_amount) }}
        </span>
      </button>
    </li>
  </ul>
</template>
