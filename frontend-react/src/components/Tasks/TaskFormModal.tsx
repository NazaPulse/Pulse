import { useState } from 'react'
import type { FormEvent } from 'react'

import { extractErrorMessage } from '../../lib/api'
import type { CreateTaskDTO, TaskPriority } from '../../types/productivity'
import { Alert } from '../Alert'
import { Field } from '../Field'
import { Modal } from '../Modal'
import { SubmitButton } from '../SubmitButton'
import { PRIORITY_LABELS } from './priority'

const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 1000

const PRIORITY_OPTIONS: { value: TaskPriority; active: string }[] = [
  { value: 'low', active: 'bg-ok-strong text-white shadow-sm' },
  { value: 'medium', active: 'bg-warn text-ink shadow-sm' },
  { value: 'high', active: 'bg-danger text-white shadow-sm' },
]

/** Fecha/hora local actual en formato `YYYY-MM-DDTHH:mm` (`<input type="datetime-local">`). */
function nowLocalInput(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

type TaskFormModalProps = {
  onClose: () => void
  onSubmit: (values: CreateTaskDTO) => Promise<void>
}

export function TaskFormModal({ onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueDateInPast, setDueDateInPast] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El backend rechaza fechas pasadas (`IsNotPastDate`): se valida al editar y al enviar.
  function isPast(value: string): boolean {
    return value !== '' && new Date(value).getTime() < Date.now()
  }

  function handleDueDateChange(value: string) {
    setDueDate(value)
    setDueDateInPast(isPast(value))
  }
  const canSubmit =
    title.trim().length > 0 &&
    title.trim().length <= TITLE_MAX_LENGTH &&
    description.length <= DESCRIPTION_MAX_LENGTH &&
    !dueDateInPast &&
    !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    if (isPast(dueDate)) {
      setDueDateInPast(true)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload: CreateTaskDTO = { title: title.trim(), priority }
      const trimmed = description.trim()
      if (trimmed) payload.description = trimmed
      if (dueDate) payload.due_date = new Date(dueDate).toISOString()

      await onSubmit(payload)
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear la tarea.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Nueva tarea" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field
          label="Título"
          name="title"
          placeholder="Pagar la tarjeta de crédito"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-description" className="text-sm font-medium text-fg-soft">
            Descripción (opcional)
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            placeholder="Vence el resumen de septiembre"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            maxLength={DESCRIPTION_MAX_LENGTH}
            className="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-white/5"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg-soft">Prioridad</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" role="radiogroup">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={priority === option.value}
                disabled={submitting}
                onClick={() => setPriority(option.value)}
                className={[
                  'rounded-md px-3 py-2 text-sm font-semibold transition',
                  priority === option.value ? option.active : 'text-fg-soft hover:text-fg',
                ].join(' ')}
              >
                {PRIORITY_LABELS[option.value]}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Vencimiento (opcional)"
          type="datetime-local"
          name="due_date"
          min={nowLocalInput()}
          value={dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
          disabled={submitting}
          error={dueDateInPast ? 'La fecha de vencimiento no puede estar en el pasado.' : undefined}
        />

        <SubmitButton loading={submitting} disabled={!canSubmit} loadingLabel="Guardando…">
          Crear tarea
        </SubmitButton>
      </form>
    </Modal>
  )
}
