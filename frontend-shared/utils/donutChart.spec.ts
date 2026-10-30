import type { CategorySummary } from '../types'
import {
  buildDonutSlices,
  CIRCUMFERENCE,
  findActive,
  isEmptyBreakdown,
  totalAmount,
} from './donutChart'

function summary(id: string, amount: number, color = ''): CategorySummary {
  return {
    category_id: id,
    category_name: `Sobre ${id}`,
    icon: '',
    color,
    total_amount: amount,
    percentage: 0,
  }
}

function dash(dasharray: string): number {
  return Number(dasharray.split(' ')[0])
}

describe('totales y estado vacío', () => {
  it('suma los montos de los sobres', () => {
    expect(totalAmount([summary('a', 30), summary('b', 70)])).toBe(100)
  })

  it('considera vacío sin sobres o con total 0', () => {
    expect(isEmptyBreakdown([])).toBe(true)
    expect(isEmptyBreakdown([summary('a', 0)])).toBe(true)
    expect(isEmptyBreakdown([summary('a', 1)])).toBe(false)
  })

  it('encuentra el sobre activo', () => {
    const categories = [summary('a', 1), summary('b', 2)]
    expect(findActive(categories, 'b')?.category_name).toBe('Sobre b')
    expect(findActive(categories, null)).toBeNull()
    expect(findActive(categories, 'zzz')).toBeNull()
  })
})

describe('buildDonutSlices', () => {
  it('una sola porción ocupa todo el anillo, sin separación', () => {
    const [slice] = buildDonutSlices([summary('a', 50)])
    expect(dash(slice.dasharray)).toBeCloseTo(CIRCUMFERENCE)
    expect(slice.offset).toBe(-0)
  })

  it('reparte el anillo en proporción, con 2 de separación y offset acumulado', () => {
    const slices = buildDonutSlices([summary('a', 75), summary('b', 25)])
    expect(dash(slices[0].dasharray)).toBeCloseTo(CIRCUMFERENCE * 0.75 - 2)
    expect(dash(slices[1].dasharray)).toBeCloseTo(CIRCUMFERENCE * 0.25 - 2)
    expect(slices[1].offset).toBeCloseTo(-CIRCUMFERENCE * 0.75)
  })

  it('cada dasharray cubre la circunferencia completa', () => {
    for (const slice of buildDonutSlices([summary('a', 1), summary('b', 2), summary('c', 3)])) {
      const [visible, hidden] = slice.dasharray.split(' ').map(Number)
      expect(visible + hidden).toBeCloseTo(CIRCUMFERENCE)
    }
  })

  it('las porciones mínimas siguen visibles (0.5)', () => {
    const slices = buildDonutSlices([summary('a', 1000), summary('b', 0.001)])
    expect(dash(slices[1].dasharray)).toBe(0.5)
  })
})

describe('buildDonutSlices', () => {
  it('usa el color del sobre o la paleta de respaldo por posición', () => {
    const slices = buildDonutSlices([summary('a', 1, '#ff0000'), summary('b', 1, ''), summary('c', 1, 'rojo')])
    expect(slices.map((s) => s.color)).toEqual(['#ff0000', '#F59E0B', '#10B981'])
  })
})
