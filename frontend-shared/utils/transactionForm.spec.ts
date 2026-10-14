import type { Account } from '../types'
import {
  amountError,
  buildTransactionPayload,
  canSubmitTransaction,
  DESCRIPTION_MAX_LENGTH,
  exceedsBalance,
  initialTransactionValues,
  isAmountValid,
  todayLocal,
} from './transactionForm'
import type { TransactionFormValues } from './transactionForm'

function account(id: string, balance: number): Account {
  return {
    id,
    name: `Cuenta ${id}`,
    type: 'bank',
    balance,
    initial_balance: balance,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

const ACCOUNTS = [account('a', 100)]

function validExpense(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return { ...initialTransactionValues(ACCOUNTS), amount: '50', categoryId: 'c', ...overrides }
}

describe('initialTransactionValues', () => {
  it('preselecciona la cuenta cuando hay una sola', () => {
    expect(initialTransactionValues(ACCOUNTS).accountId).toBe('a')
  })

  it('no preselecciona con varias cuentas', () => {
    expect(initialTransactionValues([account('a', 1), account('b', 2)]).accountId).toBe('')
  })

  it('arranca como egreso con la fecha local de hoy', () => {
    const values = initialTransactionValues(ACCOUNTS)
    expect(values.type).toBe('expense')
    expect(values.date).toBe(todayLocal())
    expect(values.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('validación del monto', () => {
  it.each(['0.01', '10', '1e3'])('acepta %s', (raw) => {
    expect(isAmountValid(raw)).toBe(true)
    expect(amountError(raw)).toBeUndefined()
  })

  it.each(['0', '-1', 'abc', 'Infinity'])('rechaza %s con mensaje', (raw) => {
    expect(isAmountValid(raw)).toBe(false)
    expect(amountError(raw)).toBe('El monto debe ser mayor a 0.')
  })

  it('no muestra error mientras el campo está vacío', () => {
    expect(isAmountValid('  ')).toBe(false)
    expect(amountError('')).toBeUndefined()
  })
})

describe('canSubmitTransaction', () => {
  it('acepta un egreso completo', () => {
    expect(canSubmitTransaction(validExpense())).toBe(true)
  })

  it('exige sobre en egresos pero no en ingresos', () => {
    expect(canSubmitTransaction(validExpense({ categoryId: '' }))).toBe(false)
    expect(canSubmitTransaction(validExpense({ type: 'income', categoryId: '' }))).toBe(true)
  })

  it('exige cuenta y fecha', () => {
    expect(canSubmitTransaction(validExpense({ accountId: '' }))).toBe(false)
    expect(canSubmitTransaction(validExpense({ date: '' }))).toBe(false)
  })

  it('respeta el máximo de la descripción', () => {
    const atLimit = 'x'.repeat(DESCRIPTION_MAX_LENGTH)
    expect(canSubmitTransaction(validExpense({ description: atLimit }))).toBe(true)
    expect(canSubmitTransaction(validExpense({ description: `${atLimit}x` }))).toBe(false)
  })
})

describe('exceedsBalance', () => {
  it('avisa solo cuando un egreso supera el saldo de la cuenta', () => {
    expect(exceedsBalance(validExpense({ amount: '150' }), ACCOUNTS)).toBe(true)
    expect(exceedsBalance(validExpense({ amount: '100' }), ACCOUNTS)).toBe(false)
    expect(exceedsBalance(validExpense({ amount: '150', type: 'income' }), ACCOUNTS)).toBe(false)
  })

  it('no avisa sin cuenta seleccionada o con monto inválido', () => {
    expect(exceedsBalance(validExpense({ amount: '150', accountId: '' }), ACCOUNTS)).toBe(false)
    expect(exceedsBalance(validExpense({ amount: '-5' }), ACCOUNTS)).toBe(false)
  })
})

describe('buildTransactionPayload', () => {
  it('arma el CreateTransactionDTO con la fecha al mediodía local en UTC', () => {
    const payload = buildTransactionPayload(validExpense({ date: '2026-09-02', description: '  Super  ' }))
    expect(payload).toEqual({
      amount: 50,
      type: 'expense',
      account_id: 'a',
      category_id: 'c',
      description: 'Super',
      date: new Date('2026-09-02T12:00:00').toISOString(),
    })
  })

  it('omite category_id y description vacíos', () => {
    const payload = buildTransactionPayload(validExpense({ type: 'income', categoryId: '', description: '   ' }))
    expect(payload).not.toHaveProperty('category_id')
    expect(payload).not.toHaveProperty('description')
  })
})
