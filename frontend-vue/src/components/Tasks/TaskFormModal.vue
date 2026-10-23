<script setup lang="ts">
import { computed, ref } from 'vue'

import { extractErrorMessage } from '../../lib/api'
import type { CreateTaskDTO, TaskPriority } from '../../types/productivity'
import Alert from '../Alert.vue'
import Field from '../Field.vue'
import Modal from '../Modal.vue'
import SubmitButton from '../SubmitButton.vue'
import { PRIORITY_LABELS } from './priority'

const props = defineProps<{
  onSubmit: (values: CreateTaskDTO) => Promise<void>
}>()

const emit = defineEmits<{ close: [] }>()

const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 1000

const PRIORITY_OPTIONS: { value: TaskPriority; active: string }[] = [
  { value: 'low', active: 'bg-ok-strong text-white shadow-sm' },
  { value: 'medium', active: 'bg-warn text-ink shadow-sm' },
  { value: 'high', active: 'bg-danger text-white shadow-sm' },
]

/** Fecha/hora local actual en formato `YYYY-MM-DDTHH:mm` (`<input type="datetime-local">`). */
function nowLocalInput(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

// El backend rechaza fechas pasadas (`IsNotPastDate`): se valida al editar y al enviar.
function isPast(value: string): boolean {
  return value !== '' && new Date(value).getTime() < Date.now()
}

const title = ref('')
const description = ref('')
const priority = ref<TaskPriority>('medium')
const dueDate = ref('')
const dueDateInPast = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const minDueDate = nowLocalInput()

function handleDueDateChange(value: string) {
  dueDate.value = value
  dueDateInPast.value = isPast(value)
}

const canSubmit = computed(
  () =>
    title.value.trim().length > 0 &&
    title.value.trim().length <= TITLE_MAX_LENGTH &&
    description.value.length <= DESCRIPTION_MAX_LENGTH &&
    !dueDateInPast.value &&
    !submitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  if (isPast(dueDate.value)) {
    dueDateInPast.value = true
    return
  }

  submitting.value = true
  error.value = null
  try {
    const payload: CreateTaskDTO = { title: title.value.trim(), priority: priority.value }
    const trimmed = description.value.trim()
    if (trimmed) payload.description = trimmed
    if (dueDate.value) payload.due_date = new Date(dueDate.value).toISOString()

    await props.onSubmit(payload)
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo crear la tarea.')
    submitting.value = false
  }
}
</script>

<template>
  <Modal title="Nueva tarea" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="title"
        label="Título"
        name="title"
        placeholder="Pagar la tarjeta de crédito"
        :disabled="submitting"
        :maxlength="TITLE_MAX_LENGTH"
        autofocus
        required
      />

      <div class="flex flex-col gap-1.5">
        <label for="task-description" class="text-sm font-medium text-fg-soft">
          Descripción (opcional)
        </label>
        <textarea
          id="task-description"
          v-model="description"
          name="description"
          rows="3"
          placeholder="Vence el resumen de septiembre"
          :disabled="submitting"
          :maxlength="DESCRIPTION_MAX_LENGTH"
          class="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-white/5"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-fg-soft">Prioridad</span>
        <div class="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
          <button
            v-for="option in PRIORITY_OPTIONS"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="priority === option.value"
            :disabled="submitting"
            :class="[
              'rounded-md px-3 py-2 text-sm font-semibold transition',
              priority === option.value ? option.active : 'text-fg-soft hover:text-fg',
            ]"
            @click="priority = option.value"
          >
            {{ PRIORITY_LABELS[option.value] }}
          </button>
        </div>
      </div>

      <Field
        :model-value="dueDate"
        label="Vencimiento (opcional)"
        type="datetime-local"
        name="due_date"
        :min="minDueDate"
        :disabled="submitting"
        :error="dueDateInPast ? 'La fecha de vencimiento no puede estar en el pasado.' : undefined"
        @update:model-value="handleDueDateChange"
      />

      <SubmitButton :loading="submitting" :disabled="!canSubmit" loading-label="Guardando…">
        Crear tarea
      </SubmitButton>
    </form>
  </Modal>
</template>
