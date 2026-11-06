<script setup lang="ts">
import type { ScheduleApi } from '../../composables/useSchedule'
import Alert from '../Alert.vue'
import Icon from '../Icon.vue'

defineProps<{ s: ScheduleApi }>()
</script>

<template>
  <div v-if="s.notice.value" class="mt-4 flex items-start gap-2">
    <div class="flex-1">
      <Alert variant="success">{{ s.notice.value }}</Alert>
    </div>
    <button type="button" aria-label="Cerrar aviso" class="rounded p-2 text-fg-dim hover:text-fg" @click="s.dismissNotice">
      <Icon name="close" svg-class="h-4 w-4" />
    </button>
  </div>
</template>
