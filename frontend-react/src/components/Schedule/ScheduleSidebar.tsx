import { TASK_DRAG_MIME, durationLabel, taskDuration } from '@shared/schedule'
import { PRIORITY_LABELS } from '@shared/tasks'
import type { Task } from '../../types/productivity'
import { Icon } from '../Icon'

type ScheduleSidebarProps = {
  tasks: Task[]
  scheduledIds: ReadonlySet<string>
  selectedId: string | null
  open: boolean
  onToggle: () => void
  onSelect: (id: string | null) => void
}

/**
 * Panel plegable con las tareas pendientes. Se arrastran a la grilla (mouse) o se tocan y luego
 * se toca una hora ("tocar y ubicar", pensado para pantallas táctiles).
 */
export function ScheduleSidebar({ tasks, scheduledIds, selectedId, open, onToggle, onSelect }: ScheduleSidebarProps) {
  const selected = tasks.find((task) => task.id === selectedId)

  return (
    <aside
      aria-label="Tareas pendientes"
      className={`pulse-card flex shrink-0 flex-col transition-[width] duration-300 ${open ? 'w-full lg:w-72' : 'w-full lg:w-14'}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
        {open ? <p className="eyebrow">Pendientes · {tasks.length}</p> : null}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Plegar panel de tareas' : 'Desplegar panel de tareas'}
          className="rounded-lg p-1.5 text-fg-dim transition hover:bg-white/10 hover:text-accent"
        >
          <Icon name={open ? 'chevronLeft' : 'chevronRight'} className="h-4 w-4" />
        </button>
      </div>

      {open && selected ? (
        <div role="status" className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
          <span className="min-w-0 flex-1">
            Tocá una hora de la grilla para ubicar <strong className="text-fg">«{selected.title}»</strong>.
          </span>
          <button type="button" onClick={() => onSelect(null)} className="font-semibold underline-offset-2 hover:underline">
            Cancelar
          </button>
        </div>
      ) : null}

      {open ? (
        <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <li className="pulse-empty text-sm">No tenés tareas pendientes.</li>
          ) : (
            tasks.map((task) => {
              const isSelected = task.id === selectedId
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    draggable
                    aria-pressed={isSelected}
                    onClick={() => onSelect(task.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(TASK_DRAG_MIME, task.id)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                    className={`flex w-full cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition active:cursor-grabbing ${isSelected ? 'border-accent bg-accent/15 text-fg shadow-glow-sm' : 'border-line bg-white/[0.03] text-fg-soft hover:border-accent/50 hover:text-fg'}`}
                  >
                    <Icon name="grip" className="h-4 w-4 shrink-0 text-fg-dim" strokeWidth={3} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{task.title}</span>
                      <span className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[0.625rem] uppercase tracking-wider text-fg-dim">
                        <span>{PRIORITY_LABELS[task.priority]}</span>
                        <span>{durationLabel(taskDuration(task))}</span>
                        {scheduledIds.has(task.id) ? <span className="text-ok">Agendada</span> : null}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}

      {open ? (
        <p className="mt-auto border-t border-line px-3 py-2.5 text-xs text-fg-dim">
          Arrastrá una tarea a la grilla, o tocála y después tocá una hora.
        </p>
      ) : null}
    </aside>
  )
}
