import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan } from '@shared/schedule'
import { useSubmission } from '../../hooks/useSubmission'
import type { Task, TimeBlock, TimeBlockCategory } from '../../types/productivity'
import { Field } from '../Field'
import { FormModal } from '../FormModal'
import { Select } from '../Select'

type BlockEditorModalProps = {
  block: TimeBlock | null
  span?: BlockSpan
  day: Date
  conflict: boolean
  tasksById: ReadonlyMap<string, Task>
  onClose: () => void
  onSave: (values: BlockFormValues) => Promise<void>
  onDelete: (block: TimeBlock) => void
  onFocus: (block: TimeBlock) => void
  onMoveToNextSlot: (block: TimeBlock) => void
  onPushFollowing: (block: TimeBlock) => void
}

function Checkbox({ checked, disabled, onChange, children }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-soft">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#00f0ff]"
      />
      {children}
    </label>
  )
}

const SECONDARY_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-fg-soft transition hover:border-accent/50 hover:text-accent'

/** Alta o edición de un bloque: horas (incluso cruzando la medianoche), categoría y tiempo real. */
export function BlockEditorModal(props: BlockEditorModalProps) {
  const { block, conflict, tasksById } = props
  const base = schedule.formBaseDay(block, props.day)
  const [values, setValues] = useState<BlockFormValues>(() => schedule.blockFormValues(block, base, props.span))
  const { submitting, error, submit } = useSubmission(schedule.SCHEDULE_SAVE_ERROR)
  const validation = schedule.blockFormError(values)
  const task = block?.task_id ? tasksById.get(block.task_id) : undefined
  const offerCompleteTask = Boolean(task && task.status === 'pending' && values.isCompleted && !block?.is_completed)

  const set = <K extends keyof BlockFormValues>(key: K, value: BlockFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validation) return
    await submit(() => props.onSave(values), { resetOnSuccess: true })
  }

  return (
    <FormModal
      title={block ? 'Editar bloque' : 'Nuevo bloque'}
      error={error}
      submitting={submitting}
      canSubmit={!validation && !submitting}
      submitLabel={block ? 'Guardar cambios' : 'Crear bloque'}
      onClose={props.onClose}
      onSubmit={handleSubmit}
    >
      {conflict && block ? (
        <div role="alert" className="flex flex-col gap-2 rounded-lg border border-danger-soft/40 bg-danger/10 p-3 text-xs text-danger-soft">
          Este bloque se superpone con otro.
          <div className="flex flex-wrap gap-2">
            <button type="button" className={SECONDARY_BUTTON} onClick={() => props.onMoveToNextSlot(block)}>
              Mover al siguiente hueco libre
            </button>
            <button type="button" className={SECONDARY_BUTTON} onClick={() => props.onPushFollowing(block)}>
              Correr los bloques siguientes
            </button>
          </div>
        </div>
      ) : null}

      <Field
        label="Título"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        maxLength={schedule.BLOCK_TITLE_MAX_LENGTH}
        disabled={submitting}
        autoFocus={!block}
        required
      />

      <Select label="Categoría" value={values.category} onChange={(e) => set('category', e.target.value as TimeBlockCategory)} disabled={submitting}>
        {schedule.CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {schedule.CATEGORY_LABELS[category]}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio" type="time" step={300} value={values.start} onChange={(e) => set('start', e.target.value)} disabled={submitting} />
        <Field label="Fin" type="time" step={300} value={values.end} onChange={(e) => set('end', e.target.value)} disabled={submitting} />
      </div>
      <Checkbox checked={values.endsNextDay} disabled={submitting} onChange={(checked) => set('endsNextDay', checked)}>
        Termina al día siguiente (cruza la medianoche)
      </Checkbox>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-description" className="text-sm font-medium text-fg-soft">
          Descripción (opcional)
        </label>
        <textarea
          id="block-description"
          rows={2}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={schedule.BLOCK_DESCRIPTION_MAX_LENGTH}
          disabled={submitting}
          className="w-full resize-y rounded-lg border border-line-strong bg-canvas/60 px-3.5 py-2.5 text-fg outline-none transition placeholder:text-fg-dim focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <Field
        label="Minutos reales"
        type="number"
        min={0}
        inputMode="numeric"
        value={values.actualMinutes}
        onChange={(e) => set('actualMinutes', e.target.value)}
        disabled={submitting}
        hint="Se suman solos con el Pomodoro; podés corregirlos a mano."
      />

      <Checkbox checked={values.isCompleted} disabled={submitting} onChange={(checked) => set('isCompleted', checked)}>
        Bloque completado
      </Checkbox>
      {offerCompleteTask && task ? (
        <Checkbox checked={values.completeTask} disabled={submitting} onChange={(checked) => set('completeTask', checked)}>
          Completar también la tarea «{task.title}»
        </Checkbox>
      ) : null}

      {validation && values.title.trim() ? <p className="text-xs text-danger-soft">{validation}</p> : null}

      {block ? (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <button type="button" className={SECONDARY_BUTTON} onClick={() => props.onFocus(block)}>
            Enfocar en Pomodoro
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger-soft transition hover:bg-danger/10"
            onClick={() => props.onDelete(block)}
          >
            Eliminar bloque
          </button>
        </div>
      ) : null}
    </FormModal>
  )
}
