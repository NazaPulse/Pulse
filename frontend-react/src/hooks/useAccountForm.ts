import type { FormEvent } from 'react'

import type { Account, AccountCreateRequest } from '@shared/types'
import { buildAccountPayload, canSubmitAccount, initialAccountValues } from '@shared/utils/accountForm'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useAccountForm(
  account: Account | null | undefined,
  onSubmit: (values: AccountCreateRequest) => Promise<void>,
) {
  const isEditing = Boolean(account)
  const { values, setField } = useFormValues(() => initialAccountValues(account))
  const { submitting, error, submit } = useSubmission('No se pudo guardar la cuenta.')
  const canSubmit = canSubmitAccount(values, isEditing) && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await submit(() => onSubmit(buildAccountPayload(values)))
  }

  return { values, setField, isEditing, submitting, error, canSubmit, handleSubmit }
}
