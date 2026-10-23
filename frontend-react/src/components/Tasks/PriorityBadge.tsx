import { PRIORITY_BADGE, PRIORITY_LABELS } from '@shared/tasks'
import type { TaskPriority } from '../../types/productivity'

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const style = PRIORITY_BADGE[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
