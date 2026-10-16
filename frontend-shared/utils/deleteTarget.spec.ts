import type { Account, Category } from '../types'
import { deleteDialogDescription, deleteDialogTitle } from './deleteTarget'
import type { DeleteTarget } from './deleteTarget'

const ACCOUNT: Account = {
  id: 'a',
  name: 'Banco Nación',
  type: 'bank',
  balance: 0,
  initial_balance: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const CATEGORY: Category = {
  id: 'c',
  name: 'Ocio',
  target_amount: 0,
  color: '#000000',
  icon: 'tag',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('diálogo de borrado', () => {
  it.each<[DeleteTarget, string]>([
    [{ kind: 'account', item: ACCOUNT }, 'Eliminar cuenta'],
    [{ kind: 'category', item: CATEGORY }, 'Eliminar sobre'],
  ])('título según el tipo (%#)', (target, title) => {
    expect(deleteDialogTitle(target)).toBe(title)
  })

  it('la descripción nombra el registro', () => {
    expect(deleteDialogDescription({ kind: 'account', item: ACCOUNT })).toBe(
      '¿Seguro que querés eliminar "Banco Nación"? Esta acción no se puede deshacer.',
    )
  })
})
