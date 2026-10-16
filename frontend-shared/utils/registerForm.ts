import type { RegisterRequest } from '../types'
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isValidPassword,
} from '../validation'

export const REDIRECT_DELAY_MS = 1200

export interface RegisterFormValues {
  email: string
  password: string
  fullName: string
}

export const EMPTY_REGISTER_VALUES: RegisterFormValues = { email: '', password: '', fullName: '' }

export function isRegisterValid(values: RegisterFormValues): boolean {
  if (!isValidEmail(values.email)) return false
  if (!isValidPassword(values.password)) return false
  return values.fullName.trim().length <= FULL_NAME_MAX_LENGTH
}

export function passwordError(password: string): string | undefined {
  if (password.length === 0 || isValidPassword(password)) return undefined
  return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
}

export function buildRegisterPayload(values: RegisterFormValues): RegisterRequest {
  const trimmedName = values.fullName.trim()
  return {
    email: values.email.trim(),
    password: values.password,
    full_name: trimmedName.length > 0 ? trimmedName : undefined,
  }
}
