<script setup lang="ts">
import type { Category } from '@shared/types'

import { tintedChipStyle } from '../lib/chartPalette'

defineProps<{ categories: Category[] }>()
const emit = defineEmits<{ edit: [category: Category]; remove: [category: Category] }>()

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

function format(value: number): string {
  return currencyFormatter.format(value)
}
</script>

<template>
  <p
    v-if="categories.length === 0"
    class="pulse-empty px-4 py-6 text-center text-sm text-fg-muted"
  >
    Todavía no tenés sobres de presupuesto. Creá el primero con el botón de arriba.
  </p>

  <ul v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <li
      v-for="(category, index) in categories"
      :key="category.id"
      class="flex items-center justify-between gap-3 pulse-card p-4"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold uppercase"
          :style="tintedChipStyle(category.color, index)"
        >
          {{ category.icon.slice(0, 2) }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-fg">{{ category.name }}</p>
          <p class="text-xs text-fg-muted">{{ category.icon }}</p>
          <p class="mt-0.5 text-base font-semibold text-fg">
            {{ format(category.target_amount) }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          :aria-label="`Editar ${category.name}`"
          class="rounded-lg p-2 text-fg-dim transition hover:bg-white/10 hover:text-accent"
          @click="emit('edit', category)"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          :aria-label="`Eliminar ${category.name}`"
          class="rounded-lg p-2 text-fg-dim transition hover:bg-danger/10 hover:text-danger-soft"
          @click="emit('remove', category)"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </li>
  </ul>
</template>
