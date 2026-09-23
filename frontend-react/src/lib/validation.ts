// Reglas de validación alineadas con openapi.yaml (RegisterRequest / LoginRequest).

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const EMAIL_MAX_LENGTH = 255
export const FULL_NAME_MAX_LENGTH = 255

// Aproximación práctica al `format: email` del contrato (sin ser exhaustiva).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && v.length <= EMAIL_MAX_LENGTH && EMAIL_RE.test(v)
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH
}

/** Password para login: el contrato sólo exige minLength 1. */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

// Reglas de validación alineadas con openapi.yaml (Account/Category).
export const NAME_MAX_LENGTH = 100
export const ICON_MAX_LENGTH = 50
export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

export function isValidName(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && v.length <= NAME_MAX_LENGTH
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim())
}
