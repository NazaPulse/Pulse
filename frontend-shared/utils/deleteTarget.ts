import type { Account, Category } from '../types'

export type DeleteTarget =
  | { kind: 'account'; item: Account }
  | { kind: 'category'; item: Category }

export function deleteDialogTitle(target: DeleteTarget): string {
  return target.kind === 'account' ? 'Eliminar cuenta' : 'Eliminar sobre'
}

/** Texto de confirmación para cualquier registro con nombre o título. */
export function deleteDialogDescriptionFor(name: string): string {
  return `¿Seguro que querés eliminar "${name}"? Esta acción no se puede deshacer.`
}

export function deleteDialogDescription(target: DeleteTarget): string {
  return deleteDialogDescriptionFor(target.item.name)
}
