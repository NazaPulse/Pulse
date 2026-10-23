import { computed, reactive, ref } from 'vue'

import {
  EMPTY_TASK_VALUES,
  TASK_CREATE_ERROR,
  buildTaskPayload,
  canSubmitTask,
  isPastDate,
} from '@shared/tasks'
import type { CreateTaskDTO } from '@shared/types'
import { useSubmission } from './useSubmission'

export function useTaskForm(onSubmit: (values: CreateTaskDTO) => Promise<void>) {
  const values = reactive({ ...EMPTY_TASK_VALUES })
  const { submitting, error, submit } = useSubmission(TASK_CREATE_ERROR)
  const dueDateInPast = ref(false)
  const canSubmit = computed(() => canSubmitTask(values) && !submitting.value)

  function setDueDate(value: string) {
    values.dueDate = value
    dueDateInPast.value = isPastDate(value)
  }

  async function handleSubmit() {
    if (!canSubmit.value) return
    if (isPastDate(values.dueDate)) {
      dueDateInPast.value = true
      return
    }
    await submit(() => onSubmit(buildTaskPayload(values)))
  }

  return { values, setDueDate, dueDateInPast, submitting, error, canSubmit, handleSubmit }
}
