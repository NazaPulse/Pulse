import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  EMPTY_TASK_VALUES,
  TASK_CREATE_ERROR,
  buildTaskPayload,
  canSubmitTask,
  isPastDate,
} from '@shared/tasks'
import type { CreateTaskDTO } from '@shared/types'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useTaskForm(onSubmit: (values: CreateTaskDTO) => Promise<void>) {
  const { values, setField } = useFormValues(EMPTY_TASK_VALUES)
  const { submitting, error, submit } = useSubmission(TASK_CREATE_ERROR)
  const [dueDateInPast, setDueDateInPast] = useState(false)
  const canSubmit = canSubmitTask(values) && !submitting

  function setDueDate(value: string) {
    setField('dueDate', value)
    setDueDateInPast(isPastDate(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    if (isPastDate(values.dueDate)) {
      setDueDateInPast(true)
      return
    }
    await submit(() => onSubmit(buildTaskPayload(values)))
  }

  return { values, setField, setDueDate, dueDateInPast, submitting, error, canSubmit, handleSubmit }
}
