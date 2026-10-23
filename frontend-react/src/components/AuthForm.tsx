import { Link } from 'react-router-dom'
import type { FormEvent } from 'react'

import type { AuthCopy, AuthField, AuthFieldKey } from '@shared/authForms'
import { Alert } from './Alert'
import { Field } from './Field'
import { SubmitButton } from './SubmitButton'

type AuthFormProps = {
  fields: AuthField[]
  values: Partial<Record<AuthFieldKey, string>>
  setField(key: AuthFieldKey, value: string): void
  copy: AuthCopy
  /** Muestra el mensaje de éxito sobre el formulario. */
  showSuccess: boolean
  /** Deshabilita los campos (envío en curso o alta ya completada). */
  locked: boolean
  submitting: boolean
  canSubmit: boolean
  error: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** Formulario de acceso a partir de la especificación de campos compartida. */
export function AuthForm(props: AuthFormProps) {
  const { fields, values, setField, copy, locked, error } = props
  return (
    <form className="flex flex-col gap-4" onSubmit={props.onSubmit} noValidate>
      {props.showSuccess ? <Alert variant="success">{copy.success}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {fields.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          type={field.type}
          name={field.name}
          autoComplete={field.autocomplete}
          placeholder={field.placeholder}
          value={values[field.key] ?? ''}
          onChange={(e) => setField(field.key, e.target.value)}
          disabled={locked}
          maxLength={field.maxLength}
          hint={field.hint}
          error={field.validate?.(values[field.key] ?? '')}
          required={field.required}
        />
      ))}

      <SubmitButton loading={props.submitting} disabled={!props.canSubmit} loadingLabel={copy.loading}>
        {copy.submit}
      </SubmitButton>
    </form>
  )
}

/** Pie de las pantallas de acceso: pregunta + enlace a la otra pantalla. */
export function AuthFooter({ copy }: { copy: AuthCopy }) {
  return (
    <>
      {copy.footerText}{' '}
      <Link to={copy.footerTo} className="font-semibold text-accent hover:text-accent-hover">
        {copy.footerLink}
      </Link>
    </>
  )
}
