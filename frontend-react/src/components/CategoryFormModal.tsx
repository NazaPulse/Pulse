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

export function CategoryFormModal({ category, onClose, onSubmit }: CategoryFormModalProps) {
  const isEditing = Boolean(category)
  const form = useCategoryForm(category, onSubmit)
  const { values, setField, submitting } = form

  return (
    <FormModal
      title={isEditing ? 'Editar sobre' : 'Nuevo sobre'}
      submitLabel={isEditing ? 'Guardar cambios' : 'Crear sobre'}
      error={form.error}
      submitting={submitting}
      canSubmit={form.canSubmit}
      onClose={onClose}
      onSubmit={form.handleSubmit}
    >
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
    </FormModal>
  )
}
