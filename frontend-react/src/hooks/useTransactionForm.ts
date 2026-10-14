import type { FormEvent } from 'react'

import type { Account, CreateTransactionDTO } from '@shared/types'
import {
  buildTransactionPayload,
  canSubmitTransaction,
  exceedsBalance,
  initialTransactionValues,
} from '@shared/utils/transactionForm'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useTransactionForm(
  accounts: Account[],
  onSubmit: (values: CreateTransactionDTO) => Promise<void>,
) {
  const { values, setField } = useFormValues(() => initialTransactionValues(accounts))
  const { submitting, error, submit } = useSubmission('No se pudo registrar la transacción.')
  const canSubmit = canSubmitTransaction(values) && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await submit(() => onSubmit(buildTransactionPayload(values)))
  }

  return {
    values, setField, submitting, error, canSubmit, handleSubmit,
    exceedsBalance: exceedsBalance(values, accounts),
  }
}
