import { Navigate, useLocation } from 'react-router-dom'

import { LOGIN_COPY, LOGIN_FIELDS } from '@shared/authForms'
import { useAuth } from '../auth/useAuth'
import { AuthCard } from '../components/AuthCard'
import { AuthFooter, AuthForm } from '../components/AuthForm'
import { useLoginForm } from '../hooks/useLoginForm'

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  // `registered` lo marca la pantalla de registro al redirigir tras un alta exitosa.
  const justRegistered = Boolean((useLocation().state as { registered?: boolean } | null)?.registered)
  const form = useLoginForm()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <AuthCard title={LOGIN_COPY.title} subtitle={LOGIN_COPY.subtitle} footer={<AuthFooter copy={LOGIN_COPY} />}>
      <AuthForm
        fields={LOGIN_FIELDS}
        values={form.values}
        setField={form.setField}
        copy={LOGIN_COPY}
        showSuccess={justRegistered}
        locked={form.submitting}
        submitting={form.submitting}
        canSubmit={form.canSubmit}
        error={form.error}
        onSubmit={form.handleSubmit}
      />
    </AuthCard>
  )
}
