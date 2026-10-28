<script setup lang="ts">
import { computed, reactive } from 'vue'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan } from '@shared/schedule'
import { useSubmission } from '../../composables/useSubmission'
import type { Task, TimeBlock } from '../../types/productivity'
import Field from '../Field.vue'
import FormModal from '../FormModal.vue'
import Select from '../Select.vue'

/** Alta o edición de un bloque: horas (incluso cruzando la medianoche), categoría y tiempo real. */
const props = defineProps<{
  block: TimeBlock | null
  span?: BlockSpan
  day: Date
  conflict: boolean
  tasksById: ReadonlyMap<string, Task>
  onSave: (values: BlockFormValues) => Promise<void>
}>()
const emit = defineEmits<{
  close: []
  delete: [block: TimeBlock]
  focus: [block: TimeBlock]
  moveToNextSlot: [block: TimeBlock]
  pushFollowing: [block: TimeBlock]
}>()

const base = schedule.formBaseDay(props.block, props.day)
const values = reactive<BlockFormValues>(schedule.blockFormValues(props.block, base, props.span))
const { submitting, error, submit } = useSubmission(schedule.SCHEDULE_SAVE_ERROR)
const validation = computed(() => schedule.blockFormError(values))
const task = computed(() => (props.block?.task_id ? props.tasksById.get(props.block.task_id) : undefined))
const offerCompleteTask = computed(() =>
  Boolean(task.value && task.value.status === 'pending' && values.isCompleted && !props.block?.is_completed),
)

async function handleSubmit() {
  if (validation.value) return
  await submit(() => props.onSave({ ...values }), { resetOnSuccess: true })
}

const SECONDARY_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-fg-soft transition hover:border-accent/50 hover:text-accent'
const CHECKBOX_LABEL = 'flex cursor-pointer items-center gap-2.5 text-sm text-fg-soft'
const CHECKBOX = 'h-4 w-4 accent-[#00f0ff]'
</script>

<template>
  <FormModal
    :title="block ? 'Editar bloque' : 'Nuevo bloque'"
    :error="error"
    :submitting="submitting"
    :can-submit="!validation && !submitting"
    :submit-label="block ? 'Guardar cambios' : 'Crear bloque'"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div
      v-if="conflict && block"
      role="alert"
      class="flex flex-col gap-2 rounded-lg border border-danger-soft/40 bg-danger/10 p-3 text-xs text-danger-soft"
    >
      Este bloque se superpone con otro.
      <div class="flex flex-wrap gap-2">
        <button type="button" :class="SECONDARY_BUTTON" @click="emit('moveToNextSlot', block)">
          Mover al siguiente hueco libre
        </button>
        <button type="button" :class="SECONDARY_BUTTON" @click="emit('pushFollowing', block)">
          Correr los bloques siguientes
        </button>
      </div>
    </div>

    <Field
      v-model="values.title"
      label="Título"
      :maxlength="schedule.BLOCK_TITLE_MAX_LENGTH"
      :disabled="submitting"
      :autofocus="!block"
      required
    />

    <Select v-model="values.category" label="Categoría" :disabled="submitting">
      <option v-for="category in schedule.CATEGORIES" :key="category" :value="category">
        {{ schedule.CATEGORY_LABELS[category] }}
      </option>
    </Select>

    <div class="grid grid-cols-2 gap-3">
      <Field v-model="values.start" label="Inicio" type="time" step="300" :disabled="submitting" />
      <Field v-model="values.end" label="Fin" type="time" step="300" :disabled="submitting" />
    </div>
    <label :class="CHECKBOX_LABEL">
      <input v-model="values.endsNextDay" type="checkbox" :disabled="submitting" :class="CHECKBOX" />
      Termina al día siguiente (cruza la medianoche)
    </label>

    <div class="flex flex-col gap-1.5">
      <label for="block-description" class="text-sm font-medium text-fg-soft">Descripción (opcional)</label>
      <textarea
        id="block-description"
        v-model="values.description"
        rows="2"
        :maxlength="schedule.BLOCK_DESCRIPTION_MAX_LENGTH"
        :disabled="submitting"
        class="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>

    <Field
      v-model="values.actualMinutes"
      label="Minutos reales"
      type="number"
      min="0"
      inputmode="numeric"
      :disabled="submitting"
      hint="Se suman solos con el Pomodoro; podés corregirlos a mano."
    />

    <label :class="CHECKBOX_LABEL">
      <input v-model="values.isCompleted" type="checkbox" :disabled="submitting" :class="CHECKBOX" />
      Bloque completado
    </label>
    <label v-if="offerCompleteTask && task" :class="CHECKBOX_LABEL">
      <input v-model="values.completeTask" type="checkbox" :disabled="submitting" :class="CHECKBOX" />
      Completar también la tarea «{{ task.title }}»
    </label>

    <p v-if="validation && values.title.trim()" class="text-xs text-danger-soft">{{ validation }}</p>

    <div v-if="block" class="flex flex-wrap gap-2 border-t border-line pt-3">
      <button type="button" :class="SECONDARY_BUTTON" @click="emit('focus', block)">Enfocar en Pomodoro</button>
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger-soft transition hover:bg-danger/10"
        @click="emit('delete', block)"
      >
        Eliminar bloque
      </button>
    </div>
  </FormModal>
</template>
