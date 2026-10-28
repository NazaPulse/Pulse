<script setup lang="ts">
import {
  DUE_DATE_PAST_MESSAGE,
  ESTIMATED_MINUTES_MESSAGE,
  ESTIMATED_MINUTES_MIN,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  isValidEstimate,
  nowLocalInput,
} from '@shared/tasks'
import { useTaskForm } from '../../composables/useTaskForm'
import type { CreateTaskDTO } from '../../types/productivity'
import Alert from '../Alert.vue'
import Field from '../Field.vue'
import Modal from '../Modal.vue'
import SubmitButton from '../SubmitButton.vue'
import PriorityPicker from './PriorityPicker.vue'

const props = defineProps<{ onSubmit: (values: CreateTaskDTO) => Promise<void> }>()
const emit = defineEmits<{ close: [] }>()

const form = useTaskForm(props.onSubmit)
const { values, submitting } = form
const minDueDate = nowLocalInput()
</script>

<template>
  <Modal title="Nueva tarea" @close="emit('close')">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="form.handleSubmit">
      <Alert v-if="form.error.value" variant="error">{{ form.error.value }}</Alert>

      <Field
        v-model="values.title"
        label="Título"
        name="title"
        placeholder="Pagar la tarjeta de crédito"
        :disabled="submitting"
        :maxlength="TASK_TITLE_MAX_LENGTH"
        autofocus
        required
      />

      <div class="flex flex-col gap-1.5">
        <label for="task-description" class="text-sm font-medium text-fg-soft">
          Descripción (opcional)
        </label>
        <textarea
          id="task-description"
          v-model="values.description"
          name="description"
          rows="3"
          placeholder="Vence el resumen de septiembre"
          :disabled="submitting"
          :maxlength="TASK_DESCRIPTION_MAX_LENGTH"
          class="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-white/5"
        />
      </div>

      <PriorityPicker v-model="values.priority" :disabled="submitting" />

      <Field
        :model-value="values.dueDate"
        label="Vencimiento (opcional)"
        type="datetime-local"
        name="due_date"
        :min="minDueDate"
        :disabled="submitting"
        :error="form.dueDateInPast.value ? DUE_DATE_PAST_MESSAGE : undefined"
        @update:model-value="form.setDueDate"
      />

      <Field
        v-model="values.estimatedMinutes"
        label="Duración estimada en minutos (opcional)"
        type="number"
        name="estimated_minutes"
        inputmode="numeric"
        :min="String(ESTIMATED_MINUTES_MIN)"
        step="5"
        placeholder="60"
        :disabled="submitting"
        hint="El Cronograma la usa al agendar la tarea."
        :error="isValidEstimate(values.estimatedMinutes) ? undefined : ESTIMATED_MINUTES_MESSAGE"
      />

      <SubmitButton :loading="submitting" :disabled="!form.canSubmit.value" loading-label="Guardando…">
        Crear tarea
      </SubmitButton>
    </form>
  </Modal>
</template>
