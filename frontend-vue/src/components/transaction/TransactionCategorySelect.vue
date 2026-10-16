<script setup lang="ts">
import type { Category } from '@shared/types'
import Select from '../Select.vue'

defineProps<{ categories: Category[]; disabled: boolean; isExpense: boolean }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <Select v-model="model" :label="isExpense ? 'Sobre' : 'Sobre (opcional)'" :disabled="disabled">
    <option value="">{{ isExpense ? 'Seleccioná un sobre' : 'Sin sobre' }}</option>
    <option v-for="category in categories" :key="category.id" :value="category.id">
      {{ category.name }}
    </option>
  </Select>
  <p v-if="isExpense && categories.length === 0" class="-mt-2 text-xs text-amber-600">
    Los egresos requieren un sobre. Creá uno desde la sección Sobres de presupuesto.
  </p>
</template>
