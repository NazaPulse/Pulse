import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { registerRequest } from '../lib/api'
import {
  buildRegisterPayload,
  EMPTY_REGISTER_VALUES,
  isRegisterValid,
  REDIRECT_DELAY_MS,
} from '@shared/utils/registerForm'
import { useFormValues } from './useFormValues'
import { useSubmission } from './useSubmission'

export function useRegisterForm() {
  const navigate = useNavigate()
  const { values, setField } = useFormValues(EMPTY_REGISTER_VALUES)
  const { submitting, error, submit } = useSubmission('No se pudo completar el registro.')
  const [done, setDone] = useState(false)
  const canSubmit = isRegisterValid(values) && !submitting && !done

  async function registerAndRedirect() {
    await registerRequest(buildRegisterPayload(values))
    setDone(true)
    window.setTimeout(() => {
      navigate('/login', { replace: true, state: { registered: true } })
    }, REDIRECT_DELAY_MS)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    await submit(registerAndRedirect, { resetOnSuccess: true })
  }

  return { values, setField, submitting, error, done, canSubmit, handleSubmit }
}
