import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { loginRequest } from '../lib/api'
import { buildLoginPayload, EMPTY_LOGIN_VALUES, isLoginValid } from '@shared/utils/loginForm'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useLoginForm() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const { values, setField } = useFormValues(EMPTY_LOGIN_VALUES)
  const { submitting, error, submit } = useSubmission('Credenciales incorrectas.')
  const canSubmit = isLoginValid(values) && !submitting

  async function loginAndEnter() {
    const { access_token } = await loginRequest(buildLoginPayload(values))
    setToken(access_token)
    navigate('/dashboard', { replace: true })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await submit(loginAndEnter, { resetOnSuccess: true })
  }

  return { values, setField, submitting, error, canSubmit, handleSubmit }
}
