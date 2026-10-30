<script setup lang="ts">
import { computed } from 'vue'

import type { ScheduleApi } from '../../composables/useSchedule'
import BlockEditorModal from './BlockEditorModal.vue'

/** Editor del bloque abierto (o del tramo nuevo). */
const props = defineProps<{ s: ScheduleApi }>()

const editorConflict = computed(() => {
  const block = props.s.editor.value?.block
  return block ? props.s.conflicts.value.has(block.id) : false
})
</script>

<template>
  <BlockEditorModal
    v-if="s.editor.value"
    :block="s.editor.value.block"
    :span="s.editor.value.span"
    :day="s.day.value"
    :conflict="editorConflict"
    :tasks-by-id="s.tasksById.value"
    :on-save="s.saveEditor"
    @close="s.closeEditor"
    @delete="s.remove"
    @focus="s.focus"
    @move-to-next-slot="s.moveToNextSlot"
    @push-following="s.pushFollowing"
  />
</template>
