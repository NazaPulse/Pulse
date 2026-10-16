import type { LoginRequest } from '../types'
import { isNonEmpty, isValidEmail } from '../validation'

export interface LoginFormValues {
  email: string
  password: string
}

export const EMPTY_LOGIN_VALUES: LoginFormValues = { email: '', password: '' }

export function isLoginValid(values: LoginFormValues): boolean {
  return isValidEmail(values.email) && isNonEmpty(values.password)
}

export function buildLoginPayload(values: LoginFormValues): LoginRequest {
  return { email: values.email.trim(), password: values.password }
}
