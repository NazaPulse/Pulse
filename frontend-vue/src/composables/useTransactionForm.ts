import { computed, reactive } from 'vue'

import type { Account, CreateTransactionDTO } from '@shared/types'
import {
  buildTransactionPayload,
  canSubmitTransaction,
  exceedsBalance,
  initialTransactionValues,
} from '@shared/utils/transactionForm'
import { useSubmission } from './useSubmission'

interface TransactionFormProps {
  accounts: Account[]
  onSubmit: (values: CreateTransactionDTO) => Promise<void>
}

export function useTransactionForm(props: TransactionFormProps) {
  const values = reactive(initialTransactionValues(props.accounts))
  const { submitting, error, submit } = useSubmission('No se pudo registrar la transacción.')
  const canSubmit = computed(() => canSubmitTransaction(values) && !submitting.value)
  const overBalance = computed(() => exceedsBalance(values, props.accounts))

  async function handleSubmit() {
    if (!canSubmit.value) return
    await submit(() => props.onSubmit(buildTransactionPayload(values)))
  }

  return { values, submitting, error, canSubmit, exceedsBalance: overBalance, handleSubmit }
}
