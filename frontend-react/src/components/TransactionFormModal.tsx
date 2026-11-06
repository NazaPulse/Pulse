import { useTransactionForm } from '../hooks/useTransactionForm'
import type { Account, Category, CreateTransactionDTO } from '@shared/types'
import { amountError, DESCRIPTION_MAX_LENGTH } from '@shared/utils/transactionForm'
import { Field } from './Field'
import { FormModal } from './FormModal'
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

type TransactionForm = ReturnType<typeof useTransactionForm>

type TransactionFieldsProps = { form: TransactionForm; accounts: Account[]; categories: Category[] }

/** Tipo de movimiento y monto. */
function AmountFields({ form }: { form: TransactionForm }) {
  const { values, setField, submitting } = form
  return (
    <>
      <TransactionTypeToggle value={values.type} disabled={submitting} onChange={(type) => setField('type', type)} />

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
    </>
  )
}

/** Cuenta y sobre. */
function SourceFields({ form, accounts, categories }: TransactionFieldsProps) {
  const { values, setField, submitting } = form
  return (
    <>
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
    </>
  )
}

/** Fecha y descripción. */
function DetailFields({ form }: { form: TransactionForm }) {
  const { values, setField, submitting } = form
  return (
    <>
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
    </>
  )
}

function NoAccountsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nueva transacción" onClose={onClose}>
      <p className="text-sm text-fg-soft">
        Necesitás al menos una cuenta para registrar movimientos. Creá una desde la sección Cuentas.
      </p>
    </Modal>
  )
}

export function TransactionFormModal({ accounts, categories, onClose, onSubmit }: TransactionFormModalProps) {
  const form = useTransactionForm(accounts, onSubmit)
  if (accounts.length === 0) return <NoAccountsModal onClose={onClose} />

  return (
    <FormModal
      title="Nueva transacción"
      submitLabel="Registrar"
      loadingLabel="Registrando…"
      submitWidthClass="sm:w-44"
      error={form.error}
      submitting={form.submitting}
      canSubmit={form.canSubmit}
      onClose={onClose}
      onSubmit={form.handleSubmit}
    >
      <AmountFields form={form} />
      <SourceFields form={form} accounts={accounts} categories={categories} />
      <DetailFields form={form} />
    </FormModal>
  )
}
