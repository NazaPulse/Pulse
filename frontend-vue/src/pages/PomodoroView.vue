<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { formatClock } from '@shared/format'

import Alert from '../components/Alert.vue'
import ProgressRing from '../components/Pomodoro/ProgressRing.vue'
import {
  MODE_DURATIONS_MS,
  usePomodoro,
  WORK_SESSIONS_PER_LONG_BREAK,
} from '../composables/usePomodoro'
import type { PomodoroMode } from '../composables/usePomodoro'

const MODES: { value: PomodoroMode; label: string; ring: string; button: string; tab: string }[] = [
  {
    value: 'work',
    label: 'Trabajo',
    ring: 'text-red-500',
    button: 'bg-red-600 hover:bg-red-700',
    tab: 'bg-red-600 text-white shadow-sm',
  },
  {
    value: 'short_break',
    label: 'Descanso corto',
    ring: 'text-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    tab: 'bg-emerald-600 text-white shadow-sm',
  },
  {
    value: 'long_break',
    label: 'Descanso largo',
    ring: 'text-sky-500',
    button: 'bg-sky-600 hover:bg-sky-700',
    tab: 'bg-sky-600 text-white shadow-sm',
  },
]

const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'Trabajo',
  short_break: 'Descanso corto',
  long_break: 'Descanso largo',
}

/** Tres tonos cortos generados con la Web Audio API (sin archivos de audio). */
function playChime(context: AudioContext | null) {
  if (!context) return
  void context.resume().catch(() => undefined)
  const start = context.currentTime
  ;[0, 0.25, 0.5].forEach((offset, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = index === 2 ? 1046.5 : 880
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.25)
  })
}

let audioContext: AudioContext | null = null
const finishedMessage = ref<string | null>(null)

const timer = usePomodoro({
  onComplete: (finished, next) => {
    playChime(audioContext)
    finishedMessage.value =
      finished === 'work'
        ? `¡Bloque de trabajo terminado! Siguiente: ${MODE_LABELS[next].toLowerCase()}.`
        : '¡Descanso terminado! A concentrarse.'
  },
})
const { mode, running, durationMs, remainingMs, progress, completedWorkSessions } = timer

const current = computed(() => MODES.find((m) => m.value === mode.value) ?? MODES[0])
const clock = computed(() => formatClock(remainingMs.value))
const sessionInCycle = computed(() => completedWorkSessions.value % WORK_SESSIONS_PER_LONG_BREAK)
const isPristine = computed(() => !running.value && remainingMs.value === durationMs.value)

// El título de la pestaña muestra la cuenta regresiva mientras corre.
const originalTitle = document.title
watch(
  [clock, running, mode],
  () => {
    document.title = running.value
      ? `${clock.value} · ${MODE_LABELS[mode.value]} — Pulse`
      : originalTitle
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.title = originalTitle
  void audioContext?.close().catch(() => undefined)
  audioContext = null
})

function handleStart() {
  // El AudioContext se crea con un gesto del usuario para que el navegador
  // permita reproducir el aviso al terminar (aunque la pestaña esté oculta).
  if (!audioContext && typeof AudioContext !== 'undefined') {
    audioContext = new AudioContext()
  }
  void audioContext?.resume().catch(() => undefined)
  finishedMessage.value = null
  timer.start()
}

function handleSelectMode(value: PomodoroMode) {
  finishedMessage.value = null
  timer.selectMode(value)
}

function handleReset() {
  finishedMessage.value = null
  timer.reset()
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Pomodoro</h1>
    <p class="mt-1 text-sm text-slate-500">
      Bloques de 25 minutos de concentración con descansos cortos y, cada
      {{ WORK_SESSIONS_PER_LONG_BREAK }} bloques, uno largo.
    </p>

    <div
      class="mx-auto mt-8 flex max-w-md flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div class="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="mode === option.value"
          :class="[
            'rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm',
            mode === option.value ? option.tab : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="handleSelectMode(option.value)"
        >
          {{ option.label }}
          <span class="block text-[11px] font-normal opacity-80">
            {{ MODE_DURATIONS_MS[option.value] / 60_000 }} min
          </span>
        </button>
      </div>

      <Alert v-if="finishedMessage" variant="success">{{ finishedMessage }}</Alert>

      <ProgressRing :progress="progress" :color-class="current.ring">
        <span
          class="font-mono text-6xl font-semibold tabular-nums tracking-tight text-slate-900"
          aria-live="off"
        >
          {{ clock }}
        </span>
        <span class="mt-1 text-sm text-slate-500">
          {{ running ? current.label : isPristine ? 'Listo para empezar' : 'En pausa' }}
        </span>
      </ProgressRing>

      <div class="flex justify-center gap-3">
        <button
          v-if="running"
          type="button"
          class="min-w-32 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
          @click="timer.pause"
        >
          Pausar
        </button>
        <button
          v-else
          type="button"
          :class="[
            'min-w-32 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition',
            current.button,
          ]"
          @click="handleStart"
        >
          {{ isPristine ? 'Iniciar' : 'Reanudar' }}
        </button>
        <button
          type="button"
          :disabled="isPristine"
          class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleReset"
        >
          Reiniciar
        </button>
      </div>

      <div class="flex flex-col items-center gap-2 border-t border-slate-100 pt-4">
        <div class="flex gap-1.5" aria-hidden="true">
          <span
            v-for="i in WORK_SESSIONS_PER_LONG_BREAK"
            :key="i"
            :class="['h-2.5 w-2.5 rounded-full', i <= sessionInCycle ? 'bg-red-500' : 'bg-slate-200']"
          />
        </div>
        <p class="text-xs text-slate-500">
          {{
            completedWorkSessions === 1
              ? '1 bloque de trabajo completado'
              : `${completedWorkSessions} bloques de trabajo completados`
          }}
        </p>
      </div>
    </div>
  </section>
</template>
