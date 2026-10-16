import type { Account, Category } from '../types'

export type DeleteTarget =
  | { kind: 'account'; item: Account }
  | { kind: 'category'; item: Category }

export function deleteDialogTitle(target: DeleteTarget): string {
  return target.kind === 'account' ? 'Eliminar cuenta' : 'Eliminar sobre'
}

export function deleteDialogDescription(target: DeleteTarget): string {
  return `¿Seguro que querés eliminar "${target.item.name}"? Esta acción no se puede deshacer.`
}
