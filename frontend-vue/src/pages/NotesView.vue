<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Alert from '../components/Alert.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import NoteCard from '../components/Notes/NoteCard.vue'
import NoteComposer from '../components/Notes/NoteComposer.vue'
import PageHeader from '../components/PageHeader.vue'
import Spinner from '../components/Spinner.vue'
import { deleteNote, extractErrorMessage, getNotes } from '../lib/api'
import type { Note } from '../types/productivity'

const notes = ref<Note[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const deleteTarget = ref<Note | null>(null)
const deleting = ref(false)

async function loadNotes() {
  error.value = null
  try {
    notes.value = await getNotes()
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudieron cargar tus notas.')
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadNotes())

function handleCreated(note: Note) {
  notes.value = [note, ...notes.value]
}

async function handleConfirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  try {
    await deleteNote(target.id)
    notes.value = notes.value.filter((n) => n.id !== target.id)
    deleteTarget.value = null
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo eliminar la nota.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
    <PageHeader
      eyebrow="03 · Ideas"
      title="Notas"
      subtitle="Escribí ideas o grabá notas de voz: el audio se sube y la nota se guarda sola al detener la grabación."
    />

    <div class="mt-6">
      <NoteComposer @created="handleCreated" />
    </div>

    <div v-if="error" class="mt-6">
      <Alert variant="error">{{ error }}</Alert>
    </div>

    <div v-if="loading" class="mt-16 flex justify-center">
      <Spinner svg-class="h-8 w-8 text-accent" />
    </div>
    <div
      v-else-if="notes.length === 0"
      class="mt-6 pulse-empty px-6 py-10 text-center text-sm text-fg-muted"
    >
      Todavía no tenés notas.
    </div>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2">
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        @delete="(n) => (deleteTarget = n)"
      />
    </div>

    <ConfirmDialog
      v-if="deleteTarget"
      title="Eliminar nota"
      :description="`¿Seguro que querés eliminar &quot;${deleteTarget.title}&quot;? Esta acción no se puede deshacer.`"
      :loading="deleting"
      @confirm="handleConfirmDelete"
      @cancel="deleteTarget = null"
    />
  </section>
</template>
