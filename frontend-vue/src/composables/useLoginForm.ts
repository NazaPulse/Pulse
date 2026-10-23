import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../auth/useAuth'
import { api } from '../lib/api'
import { buildLoginPayload, EMPTY_LOGIN_VALUES, isLoginValid } from '@shared/utils/loginForm'
import { useSubmission } from './useSubmission'

export function useLoginForm() {
  const router = useRouter()
  const { setToken } = useAuth()
  const values = reactive({ ...EMPTY_LOGIN_VALUES })
  const { submitting, error, submit } = useSubmission('Credenciales incorrectas.')
  const canSubmit = computed(() => isLoginValid(values) && !submitting.value)

  async function loginAndEnter() {
    const { access_token } = await api.loginRequest(buildLoginPayload(values))
    setToken(access_token)
    await router.replace('/dashboard')
  }

  async function handleSubmit() {
    if (!canSubmit.value) return
    await submit(loginAndEnter, { resetOnSuccess: true })
  }

  return { values, submitting, error, canSubmit, handleSubmit }
}
