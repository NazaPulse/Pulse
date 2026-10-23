import type { IconName } from '@shared/icons'
import { Icon } from './Icon'

const TONES = {
  default: 'hover:bg-white/10 hover:text-accent',
  danger: 'hover:bg-danger/10 hover:text-danger-soft',
}

type IconButtonProps = {
  icon: IconName
  label: string
  tone?: keyof typeof TONES
  onClick: () => void
}

/** Botón cuadrado con solo un ícono (acciones de fila: editar, eliminar). */
export function IconButton({ icon, label, tone = 'default', onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-lg p-2 text-fg-dim transition ${TONES[tone]}`}
    >
      <Icon name={icon} className="h-4 w-4" strokeWidth={1.7} />
    </button>
  )
}

type RowActionsProps = {
  name: string
  onEdit?: () => void
  onDelete: () => void
}

/** Editar (opcional) + eliminar, con etiquetas accesibles que incluyen el nombre del registro. */
export function RowActions({ name, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {onEdit ? <IconButton icon="edit" label={`Editar ${name}`} onClick={onEdit} /> : null}
      <IconButton icon="trash" label={`Eliminar ${name}`} tone="danger" onClick={onDelete} />
    </div>
  )
}
