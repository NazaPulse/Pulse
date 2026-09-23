import { useState } from 'react'
import type { FormEvent } from 'react'

import { extractErrorMessage } from '../lib/api'
import type { Category } from '../lib/types'
import { isValidHexColor, isValidName } from '../lib/validation'
import { Alert } from './Alert'
import { Field } from './Field'
import { Modal } from './Modal'
import { SubmitButton } from './SubmitButton'

const DEFAULT_COLOR = '#6B7280'
const DEFAULT_ICON = 'tag'

const ICON_OPTIONS = [
  'tag',
  'shopping-cart',
  'home',
  'car',
  'utensils',
  'heart',
  'plane',
  'gift',
  'book',
  'coffee',
]

type CategoryFormModalProps = {
  category?: Category | null
  onClose: () => void
  onSubmit: (values: {
    name: string
    target_amount: number
    color: string
    icon: string
  }) => Promise<void>
}

export function CategoryFormModal({ category, onClose, onSubmit }: CategoryFormModalProps) {
  const isEditing = Boolean(category)

  const [name, setName] = useState(category?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(
    category ? String(category.target_amount) : '',
  )
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR)
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_ICON)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(targetAmount)
  const canSubmit =
    isValidName(name) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 0 &&
    isValidHexColor(color) &&
    !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        target_amount: parsedAmount,
        color,
        icon: icon.trim() || DEFAULT_ICON,
      })
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo guardar el sobre.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar sobre' : 'Nuevo sobre'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field
          label="Nombre"
          name="name"
          placeholder="Supermercado"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          disabled={submitting}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="category-color">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="category-color"
              type="color"
              value={isValidHexColor(color) ? color : DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value)}
              disabled={submitting}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={submitting}
              placeholder="#6B7280"
              maxLength={7}
              className={[
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition',
                'focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
                'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                isValidHexColor(color) ? 'border-slate-300' : 'border-red-400',
              ].join(' ')}
            />
          </div>
          {!isValidHexColor(color) ? (
            <p className="text-xs text-red-600">Formato esperado: #RRGGBB</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="category-icon">
            Ícono
          </label>
          <select
            id="category-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            {ICON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <div className="sm:w-40">
            <SubmitButton loading={submitting} disabled={!canSubmit} loadingLabel="Guardando…">
              {isEditing ? 'Guardar cambios' : 'Crear sobre'}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
