<script setup lang="ts">
import { computed, ref } from 'vue'

import { currencyFormatter } from '../lib/format'
import type { CategorySummary, FinanceSummary } from '../lib/types'

const props = defineProps<{ summary: FinanceSummary }>()

// Paleta de respaldo para sobres sin color válido (`color` puede llegar como '').
const FALLBACK_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6']

const RADIUS = 60
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2 // separación visual entre porciones (en unidades de longitud del trazo)

function sliceColor(category: CategorySummary, index: number): string {
  return /^#[0-9A-Fa-f]{6}$/.test(category.color)
    ? category.color
    : FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function format(value: number): string {
  return currencyFormatter.format(value)
}

const cards = computed(() => [
  { label: 'Balance total', value: props.summary.total_balance, tone: 'text-slate-900' },
  { label: 'Ingresos', value: props.summary.total_income, tone: 'text-emerald-600' },
  { label: 'Egresos', value: props.summary.total_expenses, tone: 'text-red-600' },
])

const activeId = ref<string | null>(null)

const total = computed(() =>
  props.summary.by_category.reduce((acc, c) => acc + c.total_amount, 0),
)
const isEmpty = computed(() => props.summary.by_category.length === 0 || total.value <= 0)
const active = computed(
  () => props.summary.by_category.find((c) => c.category_id === activeId.value) ?? null,
)

const slices = computed(() => {
  const categories = props.summary.by_category
  const hasGap = categories.length > 1
  const lengths = categories.map((c) => (c.total_amount / total.value) * CIRCUMFERENCE)
  return categories.map((category, index) => {
    const dash = Math.max(lengths[index] - (hasGap ? GAP : 0), 0.5)
    return {
      category,
      color: sliceColor(category, index),
      dasharray: `${dash} ${CIRCUMFERENCE - dash}`,
      // Desplazamiento acumulado de las porciones anteriores.
      offset: -lengths.slice(0, index).reduce((acc, l) => acc + l, 0),
    }
  })
})

function toggle(id: string) {
  activeId.value = activeId.value === id ? null : id
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ card.label }}</p>
        <p :class="['mt-1 text-2xl font-semibold tabular-nums', card.tone]">
          {{ format(card.value) }}
        </p>
      </div>
    </div>

    <div>
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Egresos por sobre</h2>

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
        <div class="relative h-48 w-48 shrink-0">
          <svg
            viewBox="0 0 160 160"
            class="h-full w-full -rotate-90"
            role="img"
            aria-label="Egresos por sobre"
          >
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
              <title>{{ `${slice.category.category_name}: ${format(slice.category.total_amount)}` }}</title>
            </circle>
          </svg>
          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <span class="max-w-[7rem] truncate text-xs text-slate-500">
              {{ active ? active.category_name : 'Total egresos' }}
            </span>
            <span class="text-base font-semibold tabular-nums text-slate-900">
              {{ format(active ? active.total_amount : summary.total_expenses) }}
            </span>
            <span v-if="active" class="text-xs text-slate-500">{{ active.percentage }}%</span>
          </div>
        </div>

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
                {{ format(slice.category.total_amount) }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
