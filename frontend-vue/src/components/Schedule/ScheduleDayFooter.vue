<script setup lang="ts">
import type { ScheduleApi } from '../../composables/useSchedule'
import DaySummary from './DaySummary.vue'

/** Resumen planificado vs. real y atajos de teclado (solo en la vista de día). */
defineProps<{ s: ScheduleApi }>()
</script>

<template>
  <template v-if="s.prefs.value.mode !== 'week'">
    <DaySummary
      v-if="!s.loading.value"
      :rows="s.summary.value.rows"
      :planned="s.summary.value.planned"
      :actual="s.summary.value.actual"
      :adherence="s.summary.value.adherence"
    />

    <p class="text-xs text-fg-dim">
      Teclado: Tab para elegir un bloque · ←/→ mover 15 min · Shift+←/→ ajustar el fin · Alt+←/→ ajustar el inicio ·
      Enter editar · Supr eliminar.
    </p>
  </template>
</template>
