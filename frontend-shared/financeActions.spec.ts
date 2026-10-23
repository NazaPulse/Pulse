import { fetchFinanceData, removeTarget, saveAccount, saveCategory } from './financeActions'
import type { FinanceClient } from './financeActions'

function fakeClient() {
  const calls: unknown[][] = []
  const record = (name: string) => async (...args: unknown[]) => {
    calls.push([name, ...args])
    return `${name}-result`
  }
  const names = [
    'getAccounts',
    'getCategories',
    'getTransactions',
    'getFinanceSummary',
    'createAccount',
    'updateAccount',
    'deleteAccount',
    'createCategory',
    'updateCategory',
    'deleteCategory',
  ]
  const client = Object.fromEntries(names.map((n) => [n, record(n)])) as unknown as FinanceClient
  return { client, calls }
}

describe('fetchFinanceData', () => {
  it('reúne las cuatro consultas en un solo objeto', async () => {
    const { client } = fakeClient()
    await expect(fetchFinanceData(client)).resolves.toEqual({
      accounts: 'getAccounts-result',
      categories: 'getCategories-result',
      transactions: 'getTransactions-result',
      summary: 'getFinanceSummary-result',
    })
  })
})

describe('altas, ediciones y bajas', () => {
  const account = { id: 'a1' } as never
  const category = { id: 'c1' } as never

  it('saveAccount crea sin cuenta y edita solo nombre y tipo con cuenta', async () => {
    const { client, calls } = fakeClient()
    const values = { name: 'Banco', type: 'bank', initial_balance: 5 } as never
    await saveAccount(client, null, values)
    await saveAccount(client, account, values)
    expect(calls).toEqual([
      ['createAccount', values],
      ['updateAccount', 'a1', { name: 'Banco', type: 'bank' }],
    ])
  })

  it('saveCategory crea o edita según haya sobre seleccionado', async () => {
    const { client, calls } = fakeClient()
    const values = { name: 'Comida' } as never
    await saveCategory(client, undefined, values)
    await saveCategory(client, category, values)
    expect(calls).toEqual([
      ['createCategory', values],
      ['updateCategory', 'c1', values],
    ])
  })

  it('removeTarget elimina la cuenta o el sobre indicado', async () => {
    const { client, calls } = fakeClient()
    await removeTarget(client, { kind: 'account', item: account })
    await removeTarget(client, { kind: 'category', item: category })
    expect(calls).toEqual([
      ['deleteAccount', 'a1'],
      ['deleteCategory', 'c1'],
    ])
  })
})
