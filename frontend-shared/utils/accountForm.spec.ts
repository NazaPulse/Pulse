import type { Account } from '../types'
import {
  ACCOUNT_TYPES,
  buildAccountPayload,
  canSubmitAccount,
  initialAccountValues,
} from './accountForm'
import type { AccountFormValues } from './accountForm'

const ACCOUNT: Account = {
  id: 'a',
  name: 'Banco Nación',
  type: 'wallet',
  balance: 900,
  initial_balance: 1000,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function values(overrides: Partial<AccountFormValues> = {}): AccountFormValues {
  return { ...initialAccountValues(null), name: 'Efectivo', ...overrides }
}

describe('initialAccountValues', () => {
  it('crea una cuenta bancaria con saldo inicial 0', () => {
    expect(initialAccountValues(null)).toEqual({ name: '', type: 'bank', initialBalance: '0' })
  })

  it('precarga la cuenta al editar', () => {
    expect(initialAccountValues(ACCOUNT)).toEqual({
      name: 'Banco Nación',
      type: 'wallet',
      initialBalance: '1000',
    })
  })

  it('ofrece los tres tipos del contrato', () => {
    expect(ACCOUNT_TYPES.map((t) => t.value)).toEqual(['bank', 'wallet', 'cash'])
  })
})

describe('canSubmitAccount', () => {
  it('exige un nombre válido', () => {
    expect(canSubmitAccount(values({ name: '  ' }), false)).toBe(false)
    expect(canSubmitAccount(values({ name: 'x'.repeat(101) }), false)).toBe(false)
  })

  it('al crear, el saldo inicial debe ser numérico (vacío cuenta como 0)', () => {
    expect(canSubmitAccount(values({ initialBalance: '-50.5' }), false)).toBe(true)
    expect(canSubmitAccount(values({ initialBalance: '' }), false)).toBe(true)
    expect(canSubmitAccount(values({ initialBalance: 'abc' }), false)).toBe(false)
  })

  it('al editar no valida el saldo inicial', () => {
    expect(canSubmitAccount(values({ initialBalance: 'abc' }), true)).toBe(true)
  })
})

describe('buildAccountPayload', () => {
  it('recorta el nombre y convierte el saldo', () => {
    expect(buildAccountPayload(values({ name: '  Caja ', type: 'cash', initialBalance: '25.5' }))).toEqual({
      name: 'Caja',
      type: 'cash',
      initial_balance: 25.5,
    })
  })

  it('un saldo no numérico se envía como 0', () => {
    expect(buildAccountPayload(values({ initialBalance: 'abc' })).initial_balance).toBe(0)
  })
})
