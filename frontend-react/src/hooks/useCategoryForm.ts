import type { FormEvent } from 'react'

import type { Category, CategoryUpdateRequest } from '@shared/types'
import { buildCategoryPayload, canSubmitCategory, initialCategoryValues } from '@shared/utils/categoryForm'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useCategoryForm(
  category: Category | null | undefined,
  onSubmit: (values: CategoryUpdateRequest) => Promise<void>,
) {
  const { values, setField } = useFormValues(() => initialCategoryValues(category))
  const { submitting, error, submit } = useSubmission('No se pudo guardar el sobre.')
  const canSubmit = canSubmitCategory(values) && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await submit(() => onSubmit(buildCategoryPayload(values)))
  }

  return { values, setField, submitting, error, canSubmit, handleSubmit }
}
