import { computed, reactive } from 'vue'

import type { Account, AccountCreateRequest } from '@shared/types'
import { buildAccountPayload, canSubmitAccount, initialAccountValues } from '@shared/utils/accountForm'
import { useSubmission } from './useSubmission'

interface AccountFormProps {
  account?: Account | null
  onSubmit: (values: AccountCreateRequest) => Promise<void>
}

export function useAccountForm(props: AccountFormProps) {
  const isEditing = computed(() => Boolean(props.account))
  const values = reactive(initialAccountValues(props.account))
  const { submitting, error, submit } = useSubmission('No se pudo guardar la cuenta.')
  const canSubmit = computed(() => canSubmitAccount(values, isEditing.value) && !submitting.value)

  async function handleSubmit() {
    if (!canSubmit.value) return
    await submit(() => props.onSubmit(buildAccountPayload(values)))
  }

  return { values, isEditing, submitting, error, canSubmit, handleSubmit }
}
