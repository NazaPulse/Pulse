import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { SubmitButton } from '../components/SubmitButton'
import { extractErrorMessage, loginRequest } from '../lib/api'
import { isNonEmpty, isValidEmail } from '../lib/validation'

type LocationState = { registered?: boolean } | null

export function LoginPage() {
  const { isAuthenticated, setToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = (location.state as LocationState)?.registered ?? false

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const canSubmit = isValidEmail(email) && isNonEmpty(password) && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const { access_token } = await loginRequest({
        email: email.trim(),
        password,
      })
      setToken(access_token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Credenciales incorrectas.'))
    } finally {
      setSubmitting(false)
    }
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
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Registrate
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {justRegistered ? (
          <Alert variant="success">
            Cuenta creada correctamente. Iniciá sesión para continuar.
          </Alert>
        ) : null}

        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="usuario@pulse.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />

        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          required
        />

        <SubmitButton
          loading={submitting}
          disabled={!canSubmit}
          loadingLabel="Ingresando…"
        >
          Ingresar
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
