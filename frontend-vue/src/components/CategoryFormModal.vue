<script setup lang="ts">
import { computed, ref } from 'vue'

import { extractErrorMessage } from '../lib/api'
import type { Category } from '../lib/types'
import { isValidHexColor, isValidName } from '../lib/validation'
import Alert from './Alert.vue'
import Field from './Field.vue'
import Modal from './Modal.vue'
import SubmitButton from './SubmitButton.vue'

const DEFAULT_COLOR = '#6B7280'
const DEFAULT_ICON = 'tag'

const ICON_OPTIONS = [
  'tag',
  'shopping-cart',
  'home',
  'car',
  'utensils',
  'heart',
  'plane',
  'gift',
  'book',
  'coffee',
]

const props = defineProps<{
  category?: Category | null
  onSubmit: (values: {
    name: string
    target_amount: number
    color: string
    icon: string
  }) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const isEditing = computed(() => Boolean(props.category))

const name = ref(props.category?.name ?? '')
const targetAmount = ref(props.category ? String(props.category.target_amount) : '')
const color = ref(props.category?.color ?? DEFAULT_COLOR)
const icon = ref(props.category?.icon ?? DEFAULT_ICON)
const submitting = ref(false)
const error = ref<string | null>(null)

const parsedAmount = computed(() => Number(targetAmount.value))
const isColorValid = computed(() => isValidHexColor(color.value))
const canSubmit = computed(
  () =>
    isValidName(name.value) &&
    Number.isFinite(parsedAmount.value) &&
    parsedAmount.value >= 0 &&
    isColorValid.value &&
    !submitting.value,
)

const colorPickerValue = computed(() => (isColorValid.value ? color.value : DEFAULT_COLOR))

function onColorPickerInput(event: Event) {
  color.value = (event.target as HTMLInputElement).value
}

function onColorTextInput(event: Event) {
  color.value = (event.target as HTMLInputElement).value
}

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  try {
    await props.onSubmit({
      name: name.value.trim(),
      target_amount: parsedAmount.value,
      color: color.value,
      icon: icon.value.trim() || DEFAULT_ICON,
    })
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo guardar el sobre.')
    submitting.value = false
  }
}
</script>

<template>
  <Modal :title="isEditing ? 'Editar sobre' : 'Nuevo sobre'" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="name"
        label="Nombre"
        name="name"
        placeholder="Supermercado"
        :disabled="submitting"
        :maxlength="100"
        required
      />

      <Field
        v-model="targetAmount"
        label="Monto objetivo"
        type="number"
        step="0.01"
        min="0"
        name="target_amount"
        placeholder="500"
        :disabled="submitting"
        required
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-slate-700" for="category-color-vue">Color</label>
        <div class="flex items-center gap-3">
          <input
            id="category-color-vue"
            type="color"
            :value="colorPickerValue"
            :disabled="submitting"
            class="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            @input="onColorPickerInput"
          />
          <input
            type="text"
            :value="color"
            :disabled="submitting"
            placeholder="#6B7280"
            maxlength="7"
            :class="[
              'w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition',
              'focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              isColorValid ? 'border-slate-300' : 'border-red-400',
            ]"
            @input="onColorTextInput"
          />
        </div>
        <p v-if="!isColorValid" class="text-xs text-red-600">Formato esperado: #RRGGBB</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-slate-700" for="category-icon-vue">Ícono</label>
        <select
          id="category-icon-vue"
          v-model="icon"
          :disabled="submitting"
          class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option v-for="option in ICON_OPTIONS" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          :disabled="submitting"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <div class="sm:w-40">
          <SubmitButton :loading="submitting" :disabled="!canSubmit" loading-label="Guardando…">
            {{ isEditing ? 'Guardar cambios' : 'Crear sobre' }}
          </SubmitButton>
        </div>
      </div>
    </form>
  </Modal>
</template>
