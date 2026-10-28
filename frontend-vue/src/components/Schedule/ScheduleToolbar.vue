<script setup lang="ts">
import { WORK_HOUR_OPTIONS, formatMinute } from '@shared/schedule'
import type { SchedulePrefs, WorkHours } from '@shared/schedule'
import Icon from '../Icon.vue'

/** Vista (día/semana), zoom, horario laboral y acciones de planificación inteligente. */
defineProps<{ prefs: SchedulePrefs; busy: boolean }>()
const emit = defineEmits<{
  prefs: [patch: Partial<SchedulePrefs>]
  workHours: [edge: keyof WorkHours, minute: number]
  autoSchedule: []
  copyPreviousDay: []
}>()

const MODES = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
] as const
const ZOOMS = [
  { value: 'day', label: '24 h' },
  { value: 'work', label: 'Laboral' },
] as const
const HOURS = [
  { edge: 'start', label: 'Laboral' },
  { edge: 'end', label: 'a' },
] as const

const segmentClass = (active: boolean) => [
  'rounded-md px-2.5 py-1 text-xs font-semibold transition',
  active ? 'bg-accent text-ink shadow-glow-sm' : 'text-fg-muted hover:text-fg',
]
const ACTION_BUTTON =
  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

function onHour(edge: keyof WorkHours, event: Event) {
  emit('workHours', edge, Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div role="group" aria-label="Vista" class="flex rounded-lg border border-line-strong bg-white/[0.03] p-0.5">
      <button
        v-for="option in MODES"
        :key="option.value"
        type="button"
        :aria-pressed="prefs.mode === option.value"
        :class="segmentClass(prefs.mode === option.value)"
        @click="emit('prefs', { mode: option.value })"
      >
        {{ option.label }}
      </button>
    </div>
    <div
      v-if="prefs.mode === 'day'"
      role="group"
      aria-label="Zoom"
      class="flex rounded-lg border border-line-strong bg-white/[0.03] p-0.5"
    >
      <button
        v-for="option in ZOOMS"
        :key="option.value"
        type="button"
        :aria-pressed="prefs.zoom === option.value"
        :class="segmentClass(prefs.zoom === option.value)"
        @click="emit('prefs', { zoom: option.value })"
      >
        {{ option.label }}
      </button>
    </div>

    <div
      class="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1"
      title="Horario laboral: zoom y agendado automático"
    >
      <label v-for="hour in HOURS" :key="hour.edge" class="flex items-center gap-1.5 text-xs text-fg-muted">
        {{ hour.label }}
        <select
          :value="prefs.workHours[hour.edge]"
          class="rounded-md border border-line-strong bg-canvas/60 px-1.5 py-1 font-mono text-xs text-fg outline-none focus:border-accent"
          @change="onHour(hour.edge, $event)"
        >
          <option v-for="minute in WORK_HOUR_OPTIONS" :key="minute" :value="minute">{{ formatMinute(minute) }}</option>
        </select>
      </label>
    </div>

    <div v-if="prefs.mode === 'day'" class="flex flex-wrap gap-2 sm:ml-auto">
      <button
        type="button"
        :disabled="busy"
        :class="[ACTION_BUTTON, 'border-line-strong bg-white/[0.03] text-fg-soft hover:border-accent/50 hover:text-accent']"
        @click="emit('copyPreviousDay')"
      >
        Copiar día anterior
      </button>
      <button
        type="button"
        :disabled="busy"
        :class="[ACTION_BUTTON, 'border-accent bg-accent text-ink shadow-glow hover:bg-accent-hover']"
        @click="emit('autoSchedule')"
      >
        <Icon name="bolt" svg-class="h-3.5 w-3.5" :stroke-width="2" />
        Agendar automáticamente
      </button>
    </div>
  </div>
</template>
