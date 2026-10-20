import { useTransactionForm } from '../hooks/useTransactionForm'
import type { Account, Category, CreateTransactionDTO } from '@shared/types'
import { amountError, DESCRIPTION_MAX_LENGTH } from '@shared/utils/transactionForm'
import { Alert } from './Alert'
import { Field } from './Field'
import { FormActions } from './FormActions'
import { Modal } from './Modal'
import { TransactionAccountSelect } from './transaction/TransactionAccountSelect'
import { TransactionCategorySelect } from './transaction/TransactionCategorySelect'
import { TransactionTypeToggle } from './transaction/TransactionTypeToggle'

type TransactionFormModalProps = {
  accounts: Account[]
  categories: Category[]
  onClose: () => void
  onSubmit: (values: CreateTransactionDTO) => Promise<void>
}

export function TransactionFormModal({
  accounts,
  categories,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const form = useTransactionForm(accounts, onSubmit)
  const { values, setField, submitting } = form

  if (accounts.length === 0) {
    return (
      <Modal title="Nueva transacción" onClose={onClose}>
        <p className="text-sm text-fg-soft">
          Necesitás al menos una cuenta para registrar movimientos. Creá una desde la sección
          Cuentas.
        </p>
      </Modal>
    )
  }

  return (
    <Modal title="Nueva transacción" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

        <TransactionTypeToggle
          value={values.type}
          disabled={submitting}
          onChange={(type) => setField('type', type)}
        />

        <Field
          label="Monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          name="amount"
          placeholder="0,00"
          value={values.amount}
          onChange={(e) => setField('amount', e.target.value)}
          disabled={submitting}
          error={amountError(values.amount)}
          required
        />

        <TransactionAccountSelect
          accounts={accounts}
          value={values.accountId}
          disabled={submitting}
          exceedsBalance={form.exceedsBalance}
          onChange={(id) => setField('accountId', id)}
        />

        <TransactionCategorySelect
          categories={categories}
          value={values.categoryId}
          disabled={submitting}
          isExpense={values.type === 'expense'}
          onChange={(id) => setField('categoryId', id)}
        />

        <Field
          label="Fecha"
          type="date"
          name="date"
          value={values.date}
          onChange={(e) => setField('date', e.target.value)}
          disabled={submitting}
          required
        />

        <Field
          label="Descripción (opcional)"
          name="description"
          placeholder="Compra semanal"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          disabled={submitting}
          maxLength={DESCRIPTION_MAX_LENGTH}
        />

        <FormActions
          submitting={submitting}
          canSubmit={form.canSubmit}
          loadingLabel="Registrando…"
          onCancel={onClose}
          submitWidthClass="sm:w-44"
        >
          Registrar
        </FormActions>
      </form>
    </Modal>
  )
}
