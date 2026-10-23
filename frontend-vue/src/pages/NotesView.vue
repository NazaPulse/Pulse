<script setup lang="ts">
import { NOTES_LOAD_ERROR, NOTE_DELETE_ERROR, emptyNotesMessage } from '@shared/noteComposer'
import { deleteDialogDescriptionFor } from '@shared/utils/deleteTarget'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ErrorNotice from '../components/ErrorNotice.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import NoteCard from '../components/Notes/NoteCard.vue'
import NoteComposer from '../components/Notes/NoteComposer.vue'
import PageHeader from '../components/PageHeader.vue'
import { useConfirmDelete } from '../composables/useConfirmDelete'
import { useLoader } from '../composables/useLoader'
import { api } from '../lib/api'
import type { Note } from '../types/productivity'

const { data: notes, loading, error } = useLoader<Note[]>(() => api.getNotes(), [], NOTES_LOAD_ERROR)
const { target, setTarget, deleting, confirm } = useConfirmDelete<Note>({
  remove: (note) => api.deleteNote(note.id),
  onRemoved: (note) => {
    notes.value = notes.value.filter((n) => n.id !== note.id)
  },
  onError: (message) => {
    error.value = message
  },
  errorMessage: NOTE_DELETE_ERROR,
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="03 · Ideas"
      title="Notas"
      subtitle="Escribí ideas o grabá notas de voz: el audio se sube y la nota se guarda sola al detener la grabación."
    />

    <div class="mt-6">
      <NoteComposer @created="(note) => (notes = [note, ...notes])" />
    </div>

    <ErrorNotice :message="error" />

    <LoadingBlock v-if="loading" />
    <div v-else-if="notes.length === 0" class="mt-6 pulse-empty px-6 py-10 text-center text-sm text-fg-muted">
      {{ emptyNotesMessage }}
    </div>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2">
      <NoteCard v-for="note in notes" :key="note.id" :note="note" @delete="setTarget" />
    </div>

    <ConfirmDialog
      v-if="target"
      title="Eliminar nota"
      :description="deleteDialogDescriptionFor(target.title)"
      :loading="deleting"
      @confirm="confirm"
      @cancel="setTarget(null)"
    />
  </section>
</template>
