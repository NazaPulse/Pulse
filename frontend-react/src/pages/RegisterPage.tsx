import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { SubmitButton } from '../components/SubmitButton'
import { useRegisterForm } from '../hooks/useRegisterForm'
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@shared/validation'
import { passwordError } from '@shared/utils/registerForm'

export function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const form = useRegisterForm()
  const { values, setField } = form
  const locked = form.submitting || form.done

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Registrate para empezar a usar Pulse"
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {form.done ? (
          <Alert variant="success">
            ¡Cuenta creada! Te llevamos al inicio de sesión…
          </Alert>
        ) : null}

        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

        <Field
          label="Nombre completo (opcional)"
          type="text"
          name="full_name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={values.fullName}
          onChange={(e) => setField('fullName', e.target.value)}
          disabled={locked}
          maxLength={FULL_NAME_MAX_LENGTH}
        />

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="usuario@pulse.app"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          disabled={locked}
          required
        />

        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          disabled={locked}
          hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
          error={passwordError(values.password)}
          required
        />

        <SubmitButton
          loading={form.submitting}
          disabled={!form.canSubmit}
          loadingLabel="Creando cuenta…"
        >
          Crear cuenta
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
