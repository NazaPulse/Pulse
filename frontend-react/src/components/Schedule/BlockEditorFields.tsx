import type { ReactNode } from 'react'

import * as schedule from '@shared/schedule'
import type { BlockFormValues } from '@shared/schedule'
import type { Task, TimeBlockCategory } from '../../types/productivity'
import { Field } from '../Field'
import { Select } from '../Select'

type CheckboxProps = { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void; children: ReactNode }

function Checkbox({ checked, disabled, onChange, children }: CheckboxProps) {
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

export const SECONDARY_BUTTON =
  'rounded-lg border border-line-strong bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-fg-soft transition hover:border-accent/50 hover:text-accent'

/** Campos del formulario: valores, setter por campo y si hay un envío en curso. */
export type FieldsProps = {
  values: BlockFormValues
  set: <K extends keyof BlockFormValues>(key: K, value: BlockFormValues[K]) => void
  submitting: boolean
}

function CategorySelect({ values, set, submitting }: FieldsProps) {
  return (
    <Select
      label="Categoría"
      value={values.category}
      onChange={(e) => set('category', e.target.value as TimeBlockCategory)}
      disabled={submitting}
    >
      {schedule.CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {schedule.CATEGORY_LABELS[category]}
        </option>
      ))}
    </Select>
  )
}

function ActualMinutesField({ values, set, submitting }: FieldsProps) {
  return (
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
  )
}

export function TitleAndCategoryFields(props: FieldsProps & { isNew: boolean }) {
  const { values, set, submitting } = props
  return (
    <>
      <Field
        label="Título"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        maxLength={schedule.BLOCK_TITLE_MAX_LENGTH}
        disabled={submitting}
        autoFocus={props.isNew}
        required
      />

      <CategorySelect {...props} />
    </>
  )
}

/** Inicio, fin y si termina al día siguiente. */
export function TimeFields({ values, set, submitting }: FieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Inicio"
          type="time"
          step={300}
          value={values.start}
          onChange={(e) => set('start', e.target.value)}
          disabled={submitting}
        />
        <Field
          label="Fin"
          type="time"
          step={300}
          value={values.end}
          onChange={(e) => set('end', e.target.value)}
          disabled={submitting}
        />
      </div>
      <Checkbox checked={values.endsNextDay} disabled={submitting} onChange={(checked) => set('endsNextDay', checked)}>
        Termina al día siguiente (cruza la medianoche)
      </Checkbox>
    </>
  )
}

export function DescriptionField({ values, set, submitting }: FieldsProps) {
  return (
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
  )
}

/** Minutos reales, bloque completado y, si corresponde, completar también su tarea. */
export function CompletionFields(props: FieldsProps & { task: Task | undefined }) {
  const { values, set, submitting, task } = props
  return (
    <>
      <ActualMinutesField {...props} />

      <Checkbox checked={values.isCompleted} disabled={submitting} onChange={(checked) => set('isCompleted', checked)}>
        Bloque completado
      </Checkbox>
      {task ? (
        <Checkbox
          checked={values.completeTask}
          disabled={submitting}
          onChange={(checked) => set('completeTask', checked)}
        >
          Completar también la tarea «{task.title}»
        </Checkbox>
      ) : null}
    </>
  )
}
