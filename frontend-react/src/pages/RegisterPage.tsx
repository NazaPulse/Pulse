import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { SubmitButton } from '../components/SubmitButton'
import { extractErrorMessage, registerRequest } from '../lib/api'
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isValidPassword,
} from '../lib/validation'

const REDIRECT_DELAY_MS = 1200

export function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const emailOk = isValidEmail(email)
  const passwordOk = isValidPassword(password)
  const fullNameOk = fullName.trim().length <= FULL_NAME_MAX_LENGTH
  const canSubmit = emailOk && passwordOk && fullNameOk && !submitting && !done

  const passwordError =
    password.length > 0 && !passwordOk
      ? `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
      : undefined

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const trimmedName = fullName.trim()
      await registerRequest({
        email: email.trim(),
        password,
        full_name: trimmedName.length > 0 ? trimmedName : undefined,
      })
      setDone(true)
      window.setTimeout(() => {
        navigate('/login', { replace: true, state: { registered: true } })
      }, REDIRECT_DELAY_MS)
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo completar el registro.'))
    } finally {
      setSubmitting(false)
    }
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
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {done ? (
          <Alert variant="success">
            ¡Cuenta creada! Te llevamos al inicio de sesión…
          </Alert>
        ) : null}

        {error ? <Alert variant="error">{error}</Alert> : null}

        <Field
          label="Nombre completo (opcional)"
          type="text"
          name="full_name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={submitting || done}
          maxLength={FULL_NAME_MAX_LENGTH}
        />

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="usuario@pulse.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || done}
          required
        />

        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting || done}
          hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
          error={passwordError}
          required
        />

        <SubmitButton
          loading={submitting}
          disabled={!canSubmit}
          loadingLabel="Creando cuenta…"
        >
          Crear cuenta
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
