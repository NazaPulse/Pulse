<script setup lang="ts">
import { computed } from 'vue'

import type { ScheduleApi } from '../../composables/useSchedule'
import Icon from '../Icon.vue'

/** Anterior / Hoy / Siguiente (día o semana según la vista). */
const props = defineProps<{ s: ScheduleApi }>()

const NAV_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-accent/50 hover:text-accent'

const unit = computed(() => (props.s.prefs.value.mode === 'week' ? 'Semana' : 'Día'))
</script>

<template>
  <div class="flex items-center gap-2">
    <button type="button" :aria-label="`${unit} anterior`" :class="NAV_BUTTON" @click="s.goToDay(-1)">
      <Icon name="chevronLeft" svg-class="h-4 w-4" />
    </button>
    <button type="button" :disabled="s.isToday.value" :class="[NAV_BUTTON, 'disabled:opacity-40']" @click="s.goToToday">
      Hoy
    </button>
    <button type="button" :aria-label="`${unit} siguiente`" :class="NAV_BUTTON" @click="s.goToDay(1)">
      <Icon name="chevronRight" svg-class="h-4 w-4" />
    </button>
  </div>
</template>
