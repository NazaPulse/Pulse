import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { registerRequest } from '../lib/api'
import {
  buildRegisterPayload,
  EMPTY_REGISTER_VALUES,
  isRegisterValid,
  REDIRECT_DELAY_MS,
} from '@shared/utils/registerForm'
import { useSubmission } from './useSubmission'

export function useRegisterForm() {
  const router = useRouter()
  const values = reactive({ ...EMPTY_REGISTER_VALUES })
  const { submitting, error, submit } = useSubmission('No se pudo completar el registro.')
  const done = ref(false)
  const canSubmit = computed(() => isRegisterValid(values) && !submitting.value && !done.value)

  async function registerAndRedirect() {
    await registerRequest(buildRegisterPayload(values))
    done.value = true
    window.setTimeout(() => {
      router.replace({ path: '/login', state: { registered: true } })
    }, REDIRECT_DELAY_MS)
  }

  async function handleSubmit() {
    if (!canSubmit.value) return
    await submit(registerAndRedirect, { resetOnSuccess: true })
  }

  return { values, submitting, error, done, canSubmit, handleSubmit }
}
