import type { TaskPriority } from '../../types/productivity'
import { PRIORITY_LABELS } from './priority'

const STYLES: Record<TaskPriority, string> = {
  low: 'bg-ok/10 text-ok ring-ok/30',
  medium: 'bg-warn/10 text-warn ring-warn/30',
  high: 'bg-danger/10 text-danger-soft ring-danger-soft/30',
}

const DOTS: Record<TaskPriority, string> = {
  low: 'bg-ok',
  medium: 'bg-warn',
  high: 'bg-danger-soft',
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[priority]}`} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
