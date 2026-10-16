import { computed, reactive } from 'vue'

import type { Category, CategoryUpdateRequest } from '@shared/types'
import { buildCategoryPayload, canSubmitCategory, initialCategoryValues } from '@shared/utils/categoryForm'
import { useSubmission } from './useSubmission'

interface CategoryFormProps {
  category?: Category | null
  onSubmit: (values: CategoryUpdateRequest) => Promise<void>
}

export function useCategoryForm(props: CategoryFormProps) {
  const values = reactive(initialCategoryValues(props.category))
  const { submitting, error, submit } = useSubmission('No se pudo guardar el sobre.')
  const canSubmit = computed(() => canSubmitCategory(values) && !submitting.value)

  async function handleSubmit() {
    if (!canSubmit.value) return
    await submit(() => props.onSubmit(buildCategoryPayload(values)))
  }

  return { values, submitting, error, canSubmit, handleSubmit }
}
