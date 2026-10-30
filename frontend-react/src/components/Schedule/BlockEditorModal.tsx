import { useState } from 'react'
import type { FormEvent } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockFormValues, BlockSpan } from '@shared/schedule'
import { useSubmission } from '../../hooks/useSubmission'
import type { Task, TimeBlock } from '../../types/productivity'
import { FormModal } from '../FormModal'
import { CompletionFields, DescriptionField, TimeFields, TitleAndCategoryFields } from './BlockEditorFields'
import type { FieldsProps } from './BlockEditorFields'
import { BlockFooterActions, ConflictActions } from './BlockEditorActions'

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

const pendingTaskOf = (block: TimeBlock | null, tasksById: ReadonlyMap<string, Task>) => {
  const task = block?.task_id ? tasksById.get(block.task_id) : undefined
  return task?.status === 'pending' ? task : undefined
}

/** Tarea vinculada que se ofrece completar: pendiente, y el bloque pasa a completado en este guardado. */
function completableTask(block: TimeBlock | null, values: BlockFormValues, tasksById: ReadonlyMap<string, Task>) {
  const completing = values.isCompleted && !block?.is_completed
  return completing ? pendingTaskOf(block, tasksById) : undefined
}

const COPY = {
  create: { title: 'Nuevo bloque', submitLabel: 'Crear bloque' },
  edit: { title: 'Editar bloque', submitLabel: 'Guardar cambios' },
}

type EditorBodyProps = { props: BlockEditorModalProps; fields: FieldsProps; validation: string | null }

function ConflictNotice({ block, conflict, onMoveToNextSlot, onPushFollowing }: BlockEditorModalProps) {
  if (!conflict || !block) return null
  return <ConflictActions block={block} onMoveToNextSlot={onMoveToNextSlot} onPushFollowing={onPushFollowing} />
}

/** Campos del editor, avisos de conflicto y de validación, y acciones del bloque existente. */
function EditorBody({ props, fields, validation }: EditorBodyProps) {
  const { block } = props
  return (
    <>
      <ConflictNotice {...props} />
      <TitleAndCategoryFields {...fields} isNew={!block} />
      <TimeFields {...fields} />
      <DescriptionField {...fields} />
      <CompletionFields {...fields} task={completableTask(block, fields.values, props.tasksById)} />
      {validation && fields.values.title.trim() ? <p className="text-xs text-danger-soft">{validation}</p> : null}
      {block ? <BlockFooterActions block={block} onFocus={props.onFocus} onDelete={props.onDelete} /> : null}
    </>
  )
}

/** Alta o edición de un bloque: horas (incluso cruzando la medianoche), categoría y tiempo real. */
export function BlockEditorModal(props: BlockEditorModalProps) {
  const base = schedule.formBaseDay(props.block, props.day)
  const [values, setValues] = useState<BlockFormValues>(() => schedule.blockFormValues(props.block, base, props.span))
  const { submitting, error, submit } = useSubmission(schedule.SCHEDULE_SAVE_ERROR)
  const validation = schedule.blockFormError(values)
  const set: FieldsProps['set'] = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validation) return
    await submit(() => props.onSave(values), { resetOnSuccess: true })
  }

  return (
    <FormModal
      {...COPY[props.block ? 'edit' : 'create']}
      error={error}
      submitting={submitting}
      canSubmit={!validation && !submitting}
      onClose={props.onClose}
      onSubmit={handleSubmit}
    >
      <EditorBody props={props} fields={{ values, set, submitting }} validation={validation} />
    </FormModal>
  )
}
