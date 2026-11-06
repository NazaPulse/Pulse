import type { Category, CategoryUpdateRequest } from '../types'
import { isValidHexColor, isValidName } from '../validation'
import { withDefaults } from './withDefaults'

export const DEFAULT_COLOR = '#6B7280'
export const DEFAULT_ICON = 'tag'

export const ICON_OPTIONS = [
  'tag',
  'shopping-cart',
  'home',
  'car',
  'utensils',
  'heart',
  'plane',
  'gift',
  'book',
  'coffee',
]

export interface CategoryFormValues {
  name: string
  targetAmount: string
  color: string
  icon: string
}

const NEW_CATEGORY_VALUES: CategoryFormValues = { name: '', targetAmount: '', color: DEFAULT_COLOR, icon: DEFAULT_ICON }

export function initialCategoryValues(category?: Category | null): CategoryFormValues {
  if (!category) return { ...NEW_CATEGORY_VALUES }
  const values = { name: category.name, targetAmount: String(category.target_amount), color: category.color, icon: category.icon }
  return withDefaults(values, NEW_CATEGORY_VALUES)
}

function isValidTargetAmount(raw: string): boolean {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0
}

export function canSubmitCategory(values: CategoryFormValues): boolean {
  if (!isValidName(values.name)) return false
  if (!isValidTargetAmount(values.targetAmount)) return false
  return isValidHexColor(values.color)
}

export function buildCategoryPayload(values: CategoryFormValues): CategoryUpdateRequest {
  return {
    name: values.name.trim(),
    target_amount: Number(values.targetAmount),
    color: values.color,
    icon: values.icon.trim() || DEFAULT_ICON,
  }
}
