import type { CategorySummary } from '../types'

export const RADIUS = 60
export const STROKE = 22
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2 // separación visual entre porciones (en unidades de longitud del trazo)

// Paleta de respaldo para sobres sin color válido (`color` puede llegar como '').
const FALLBACK_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6']

export interface DonutSlice {
  category: CategorySummary
  color: string
  dasharray: string
  offset: number
}

function sliceColor(category: CategorySummary, index: number): string {
  return /^#[0-9A-Fa-f]{6}$/.test(category.color)
    ? category.color
    : FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function totalAmount(categories: CategorySummary[]): number {
  return categories.reduce((acc, c) => acc + c.total_amount, 0)
}

export function isEmptyBreakdown(categories: CategorySummary[]): boolean {
  return categories.length === 0 || totalAmount(categories) <= 0
}

export function findActive(categories: CategorySummary[], activeId: string | null) {
  return categories.find((c) => c.category_id === activeId) ?? null
}

export function buildDonutSlices(categories: CategorySummary[]): DonutSlice[] {
  const total = totalAmount(categories)
  const gap = categories.length > 1 ? GAP : 0
  const lengths = categories.map((c) => (c.total_amount / total) * CIRCUMFERENCE)
  return categories.map((category, index) => {
    const dash = Math.max(lengths[index] - gap, 0.5)
    return {
      category,
      color: sliceColor(category, index),
      dasharray: `${dash} ${CIRCUMFERENCE - dash}`,
      // Desplazamiento acumulado de las porciones anteriores.
      offset: -lengths.slice(0, index).reduce((acc, l) => acc + l, 0),
    }
  })
}
