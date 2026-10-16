import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../validation'
import {
  buildRegisterPayload,
  EMPTY_REGISTER_VALUES,
  isRegisterValid,
  passwordError,
} from './registerForm'
import type { RegisterFormValues } from './registerForm'

function values(overrides: Partial<RegisterFormValues> = {}): RegisterFormValues {
  return {
    ...EMPTY_REGISTER_VALUES,
    email: 'ada@pulse.app',
    password: 'x'.repeat(PASSWORD_MIN_LENGTH),
    ...overrides,
  }
}

describe('isRegisterValid', () => {
  it('acepta email y contraseña válidos sin nombre', () => {
    expect(isRegisterValid(values())).toBe(true)
  })

  it('el formulario vacío no es válido', () => {
    expect(isRegisterValid(EMPTY_REGISTER_VALUES)).toBe(false)
  })

  it.each([
    ['email inválido', { email: 'ada@' }],
    ['contraseña corta', { password: 'x'.repeat(PASSWORD_MIN_LENGTH - 1) }],
    ['nombre demasiado largo', { fullName: 'x'.repeat(FULL_NAME_MAX_LENGTH + 1) }],
  ])('rechaza %s', (_label, overrides: Partial<RegisterFormValues>) => {
    expect(isRegisterValid(values(overrides))).toBe(false)
  })
})

describe('passwordError', () => {
  it('no muestra error con el campo vacío o una contraseña válida', () => {
    expect(passwordError('')).toBeUndefined()
    expect(passwordError('x'.repeat(PASSWORD_MIN_LENGTH))).toBeUndefined()
  })

  it('indica el mínimo de caracteres', () => {
    expect(passwordError('corta')).toBe(
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    )
  })
})

describe('buildRegisterPayload', () => {
  it('recorta el email y omite el nombre vacío', () => {
    expect(buildRegisterPayload(values({ email: '  ada@pulse.app ', fullName: '   ' }))).toEqual({
      email: 'ada@pulse.app',
      password: 'x'.repeat(PASSWORD_MIN_LENGTH),
      full_name: undefined,
    })
  })

  it('envía el nombre recortado y la contraseña sin tocar', () => {
    const payload = buildRegisterPayload(values({ fullName: ' Ada Lovelace ', password: ' con espacios  ' }))
    expect(payload.full_name).toBe('Ada Lovelace')
    expect(payload.password).toBe(' con espacios  ')
  })
})
