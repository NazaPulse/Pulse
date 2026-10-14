import type { Category } from '../types'
import {
  buildCategoryPayload,
  canSubmitCategory,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  ICON_OPTIONS,
  initialCategoryValues,
} from './categoryForm'
import type { CategoryFormValues } from './categoryForm'

const CATEGORY: Category = {
  id: 'c1',
  name: 'Supermercado',
  target_amount: 500,
  color: '#FF5733',
  icon: 'shopping-cart',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function values(overrides: Partial<CategoryFormValues> = {}): CategoryFormValues {
  return { ...initialCategoryValues(null), name: 'Ocio', ...overrides }
}

describe('initialCategoryValues', () => {
  it('usa los valores por defecto al crear', () => {
    expect(initialCategoryValues(null)).toEqual({
      name: '',
      targetAmount: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
    })
  })

  it('precarga el sobre al editar', () => {
    expect(initialCategoryValues(CATEGORY)).toEqual({
      name: 'Supermercado',
      targetAmount: '500',
      color: '#FF5733',
      icon: 'shopping-cart',
    })
  })

  it('el ícono por defecto está entre las opciones', () => {
    expect(ICON_OPTIONS).toContain(DEFAULT_ICON)
  })
})

describe('canSubmitCategory', () => {
  it('acepta un sobre válido', () => {
    expect(canSubmitCategory(values({ targetAmount: '250.5' }))).toBe(true)
  })

  it('un monto objetivo vacío cuenta como 0', () => {
    expect(canSubmitCategory(values({ targetAmount: '' }))).toBe(true)
  })

  it.each([
    ['nombre vacío', { name: '   ' }],
    ['nombre largo', { name: 'x'.repeat(101) }],
    ['monto negativo', { targetAmount: '-1' }],
    ['monto no numérico', { targetAmount: 'abc' }],
    ['color sin formato #RRGGBB', { color: '#FFF' }],
  ])('rechaza %s', (_label, overrides: Partial<CategoryFormValues>) => {
    expect(canSubmitCategory(values(overrides))).toBe(false)
  })
})

describe('buildCategoryPayload', () => {
  it('normaliza nombre y monto', () => {
    expect(buildCategoryPayload(values({ name: '  Ocio ', targetAmount: '10.5', icon: 'car' }))).toEqual({
      name: 'Ocio',
      target_amount: 10.5,
      color: DEFAULT_COLOR,
      icon: 'car',
    })
  })

  it('usa el ícono por defecto si queda vacío', () => {
    expect(buildCategoryPayload(values({ icon: '  ' })).icon).toBe(DEFAULT_ICON)
  })
})
