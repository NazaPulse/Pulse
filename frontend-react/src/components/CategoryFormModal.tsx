import { useCategoryForm } from '../hooks/useCategoryForm'
import type { Category, CategoryUpdateRequest } from '@shared/types'
import { ICON_OPTIONS } from '@shared/utils/categoryForm'
import { CategoryColorField } from './category/CategoryColorField'
import { Field } from './Field'
import { FormModal } from './FormModal'
import { Select } from './Select'

type CategoryFormModalProps = {
  category?: Category | null
  onClose: () => void
  onSubmit: (values: CategoryUpdateRequest) => Promise<void>
}

type CategoryForm = ReturnType<typeof useCategoryForm>

function CategoryNameField({ form }: { form: CategoryForm }) {
  const { values, setField, submitting } = form
  return (
    <>
      <Field
        label="Nombre"
        name="name"
        placeholder="Supermercado"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        disabled={submitting}
        maxLength={100}
        required
      />
    </>
  )
}

function TargetAmountField({ form }: { form: CategoryForm }) {
  const { values, setField, submitting } = form
  return (
    <>
      <Field
        label="Monto objetivo"
        type="number"
        step="0.01"
        min="0"
        name="target_amount"
        placeholder="500"
        value={values.targetAmount}
        onChange={(e) => setField('targetAmount', e.target.value)}
        disabled={submitting}
        required
      />
    </>
  )
}

function CategoryAmountFields({ form }: { form: CategoryForm }) {
  return (
    <>
      <CategoryNameField form={form} />
      <TargetAmountField form={form} />
    </>
  )
}

function CategoryLookFields({ form }: { form: CategoryForm }) {
  const { values, setField, submitting } = form
  return (
    <>
      <CategoryColorField value={values.color} disabled={submitting} onChange={(color) => setField('color', color)} />

      <Select
        label="Ícono"
        value={values.icon}
        onChange={(e) => setField('icon', e.target.value)}
        disabled={submitting}
      >
        {ICON_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </>
  )
}

function CategoryFields({ form }: { form: CategoryForm }) {
  return (
    <>
      <CategoryAmountFields form={form} />
      <CategoryLookFields form={form} />
    </>
  )
}

export function CategoryFormModal({ category, onClose, onSubmit }: CategoryFormModalProps) {
  const isEditing = Boolean(category)
  const form = useCategoryForm(category, onSubmit)

  return (
    <FormModal
      title={isEditing ? 'Editar sobre' : 'Nuevo sobre'}
      submitLabel={isEditing ? 'Guardar cambios' : 'Crear sobre'}
      error={form.error}
      submitting={form.submitting}
      canSubmit={form.canSubmit}
      onClose={onClose}
      onSubmit={form.handleSubmit}
    >
      <CategoryFields form={form} />
    </FormModal>
  )
}
