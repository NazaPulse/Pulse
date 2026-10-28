<script setup lang="ts">
import { computed } from 'vue'

import { CATEGORY_COLORS, CATEGORY_LABELS, durationLabel } from '@shared/schedule'
import type { CategoryTotals } from '@shared/schedule'

/** Planificado vs. real del día, por categoría, con el porcentaje de cumplimiento. */
const props = defineProps<{ rows: CategoryTotals[]; planned: number; actual: number; adherence: number | null }>()

const scale = computed(() => Math.max(1, ...props.rows.flatMap((row) => [row.planned, row.actual])))
</script>

<template>
  <section aria-label="Resumen del día" class="pulse-card p-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Planificado vs. real</p>
        <p class="mt-1 font-mono text-xs text-fg-muted">
          {{ durationLabel(actual) }} reales de {{ durationLabel(planned) }} planificados
        </p>
      </div>
      <div class="text-right">
        <p class="font-display text-3xl font-bold text-accent text-glow">
          {{ adherence === null ? '—' : `${adherence}%` }}
        </p>
        <p class="text-[0.6875rem] uppercase tracking-wider text-fg-dim">Cumplimiento</p>
      </div>
    </div>

    <p v-if="rows.length === 0" class="mt-4 text-sm text-fg-dim">Todavía no hay bloques este día.</p>
    <ul v-else class="mt-4 flex flex-col gap-3">
      <li
        v-for="row in rows"
        :key="row.category"
        class="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-xs"
      >
        <span class="text-fg-soft">{{ CATEGORY_LABELS[row.category] }}</span>
        <span class="relative h-3 rounded-full bg-white/5" aria-hidden="true">
          <span
            class="absolute inset-y-0 left-0 rounded-full border"
            :style="{
              width: `${(row.planned / scale) * 100}%`,
              backgroundColor: `${CATEGORY_COLORS[row.category]}26`,
              borderColor: `${CATEGORY_COLORS[row.category]}66`,
            }"
          />
          <span
            class="absolute bottom-0 left-0 h-1.5 rounded-full"
            :style="{
              width: `${(row.actual / scale) * 100}%`,
              backgroundColor: CATEGORY_COLORS[row.category],
              boxShadow: `0 0 8px ${CATEGORY_COLORS[row.category]}`,
            }"
          />
        </span>
        <span class="font-mono text-fg-muted">{{ durationLabel(row.actual) }} / {{ durationLabel(row.planned) }}</span>
      </li>
    </ul>
  </section>
</template>
