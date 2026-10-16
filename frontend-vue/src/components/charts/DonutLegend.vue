<script setup lang="ts">
import { currencyFormatter } from '@shared/format'
import type { DonutSlice } from '@shared/utils/donutChart'

defineProps<{ slices: DonutSlice[] }>()
const activeId = defineModel<string | null>('activeId', { required: true })
</script>

<template>
  <ul class="flex w-full flex-col gap-1">
    <li v-for="slice in slices" :key="slice.category.category_id">
      <button
        type="button"
        :class="[
          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition',
          activeId === slice.category.category_id ? 'bg-slate-100' : 'hover:bg-slate-50',
        ]"
        @mouseenter="activeId = slice.category.category_id"
        @mouseleave="activeId = null"
        @focus="activeId = slice.category.category_id"
        @blur="activeId = null"
      >
        <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: slice.color }" />
        <span class="min-w-0 flex-1 truncate text-slate-700">
          {{ slice.category.category_name }}
        </span>
        <span class="tabular-nums text-slate-500">{{ slice.category.percentage }}%</span>
        <span class="w-28 text-right font-medium tabular-nums text-slate-900">
          {{ currencyFormatter.format(slice.category.total_amount) }}
        </span>
      </button>
    </li>
  </ul>
</template>
