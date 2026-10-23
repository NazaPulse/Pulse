<script setup lang="ts">
import { tintedChipStyle } from '@shared/chartPalette'
import { currencyFormatter } from '@shared/format'
import type { Category } from '@shared/types'
import RowActions from './RowActions.vue'

defineProps<{ categories: Category[] }>()
const emit = defineEmits<{ edit: [category: Category]; remove: [category: Category] }>()
</script>

<template>
  <p v-if="categories.length === 0" class="pulse-empty px-4 py-6 text-center text-sm text-fg-muted">
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
            {{ currencyFormatter.format(category.target_amount) }}
          </p>
        </div>
      </div>
      <RowActions editable :name="category.name" @edit="emit('edit', category)" @remove="emit('remove', category)" />
    </li>
  </ul>
</template>
