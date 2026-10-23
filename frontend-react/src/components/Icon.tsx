import { ICON_PATHS } from '@shared/icons'
import type { IconName } from '@shared/icons'

type IconProps = {
  name: IconName
  className?: string
  strokeWidth?: number
}

/** Ícono de trazo (24×24) que hereda el color del texto (`currentColor`). */
export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
