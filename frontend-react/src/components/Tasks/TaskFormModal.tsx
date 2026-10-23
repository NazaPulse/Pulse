import {
  DUE_DATE_PAST_MESSAGE,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  nowLocalInput,
} from '@shared/tasks'
import { useTaskForm } from '../../hooks/useTaskForm'
import type { CreateTaskDTO } from '../../types/productivity'
import { Alert } from '../Alert'
import { Field } from '../Field'
import { Modal } from '../Modal'
import { SubmitButton } from '../SubmitButton'
import { PriorityPicker } from './PriorityPicker'

type TaskFormModalProps = {
  onClose: () => void
  onSubmit: (values: CreateTaskDTO) => Promise<void>
}

export function TaskFormModal({ onClose, onSubmit }: TaskFormModalProps) {
  const form = useTaskForm(onSubmit)
  const { values, setField, submitting } = form

  return (
    <Modal title="Nueva tarea" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

        <Field
          label="Título"
          name="title"
          placeholder="Pagar la tarjeta de crédito"
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          disabled={submitting}
          maxLength={TASK_TITLE_MAX_LENGTH}
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
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            disabled={submitting}
            maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            className="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-white/5"
          />
        </div>

        <PriorityPicker value={values.priority} disabled={submitting} onChange={(p) => setField('priority', p)} />

        <Field
          label="Vencimiento (opcional)"
          type="datetime-local"
          name="due_date"
          min={nowLocalInput()}
          value={values.dueDate}
          onChange={(e) => form.setDueDate(e.target.value)}
          disabled={submitting}
          error={form.dueDateInPast ? DUE_DATE_PAST_MESSAGE : undefined}
        />

        <SubmitButton loading={submitting} disabled={!form.canSubmit} loadingLabel="Guardando…">
          Crear tarea
        </SubmitButton>
      </form>
    </Modal>
  )
}
