<script setup lang="ts">
import { ref } from 'vue'

import { deleteDialogDescriptionFor } from '@shared/utils/deleteTarget'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ErrorNotice from '../components/ErrorNotice.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import PageHeader from '../components/PageHeader.vue'
import TaskFormModal from '../components/Tasks/TaskFormModal.vue'
import TaskList from '../components/Tasks/TaskList.vue'
import TasksToolbar from '../components/Tasks/TasksToolbar.vue'
import { useTasks } from '../composables/useTasks'
import type { CreateTaskDTO } from '../types/productivity'

const tasks = useTasks()
const formOpen = ref(false)
const { target, deleting } = tasks.confirmDelete

async function handleCreate(values: CreateTaskDTO) {
  await tasks.create(values)
  formOpen.value = false
}
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="02 · Productividad"
      title="Tareas"
      subtitle="Marcá una tarea para completarla; el cambio se guarda al instante."
    >
      <template #actions>
        <button
          type="button"
          class="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
          @click="formOpen = true"
        >
          + Nueva tarea
        </button>
      </template>
    </PageHeader>

    <ErrorNotice :message="tasks.error.value" />

    <div class="mt-6">
      <TasksToolbar
        :view="tasks.view"
        :counts="tasks.counts.value"
        @change="(patch) => Object.assign(tasks.view, patch)"
      />
    </div>

    <div class="mt-4">
      <LoadingBlock v-if="tasks.loading.value" />
      <TaskList
        v-else
        :tasks="tasks.visible.value"
        :toggling-ids="tasks.togglingIds.value"
        :empty-message="tasks.emptyMessage.value"
        :now="tasks.now.value"
        @toggle="(task) => void tasks.toggle(task)"
        @delete="tasks.confirmDelete.setTarget"
      />
    </div>

    <TaskFormModal v-if="formOpen" :on-submit="handleCreate" @close="formOpen = false" />

    <ConfirmDialog
      v-if="target"
      title="Eliminar tarea"
      :description="deleteDialogDescriptionFor(target.title)"
      :loading="deleting"
      @confirm="tasks.confirmDelete.confirm"
      @cancel="tasks.confirmDelete.setTarget(null)"
    />
  </section>
</template>
