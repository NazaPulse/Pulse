import { Link, Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { SubmitButton } from '../components/SubmitButton'
import { useLoginForm } from '../hooks/useLoginForm'

type LocationState = { registered?: boolean } | null

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const justRegistered = (location.state as LocationState)?.registered ?? false
  const form = useLoginForm()
  const { values, setField, submitting } = form

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Accedé a tu cuenta de Pulse"
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Registrate
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        {justRegistered ? (
          <Alert variant="success">
            Cuenta creada correctamente. Iniciá sesión para continuar.
          </Alert>
        ) : null}

        {form.error ? <Alert variant="error">{form.error}</Alert> : null}

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="usuario@pulse.app"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          disabled={submitting}
          required
        />

        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          disabled={submitting}
          required
        />

        <SubmitButton
          loading={submitting}
          disabled={!form.canSubmit}
          loadingLabel="Ingresando…"
        >
          Ingresar
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
