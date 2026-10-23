import { Navigate } from 'react-router-dom'

import { REGISTER_COPY, REGISTER_FIELDS } from '@shared/authForms'
import { useAuth } from '../auth/useAuth'
import { AuthCard } from '../components/AuthCard'
import { AuthFooter, AuthForm } from '../components/AuthForm'
import { useRegisterForm } from '../hooks/useRegisterForm'

export function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const form = useRegisterForm()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <AuthCard title={REGISTER_COPY.title} subtitle={REGISTER_COPY.subtitle} footer={<AuthFooter copy={REGISTER_COPY} />}>
      <AuthForm
        fields={REGISTER_FIELDS}
        values={form.values}
        setField={form.setField}
        copy={REGISTER_COPY}
        showSuccess={form.done}
        locked={form.submitting || form.done}
        submitting={form.submitting}
        canSubmit={form.canSubmit}
        error={form.error}
        onSubmit={form.handleSubmit}
      />
    </AuthCard>
  )
}
