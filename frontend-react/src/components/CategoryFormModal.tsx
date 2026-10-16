import { useCategoryForm } from '../hooks/useCategoryForm'
import type { Category, CategoryUpdateRequest } from '@shared/types'
import { ICON_OPTIONS } from '@shared/utils/categoryForm'
import { Alert } from './Alert'
import { CategoryColorField } from './category/CategoryColorField'
import { Field } from './Field'
import { FormActions } from './FormActions'
import { Modal } from './Modal'
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
    <Modal title={isEditing ? 'Editar sobre' : 'Nuevo sobre'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

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

        <CategoryColorField
          value={values.color}
          disabled={submitting}
          onChange={(color) => setField('color', color)}
        />

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

        <FormActions
          submitting={submitting}
          canSubmit={form.canSubmit}
          loadingLabel="Guardando…"
          onCancel={onClose}
        >
          {isEditing ? 'Guardar cambios' : 'Crear sobre'}
        </FormActions>
      </form>
    </Modal>
  )
}
