import { buildLoginPayload, EMPTY_LOGIN_VALUES, isLoginValid } from './loginForm'

describe('isLoginValid', () => {
  it('exige email válido y contraseña no vacía', () => {
    expect(isLoginValid({ email: 'ada@pulse.app', password: 'x' })).toBe(true)
    expect(isLoginValid(EMPTY_LOGIN_VALUES)).toBe(false)
    expect(isLoginValid({ email: 'ada@', password: 'x' })).toBe(false)
    expect(isLoginValid({ email: 'ada@pulse.app', password: '   ' })).toBe(false)
  })
})

describe('buildLoginPayload', () => {
  it('recorta el email y envía la contraseña sin tocar', () => {
    expect(buildLoginPayload({ email: '  ada@pulse.app ', password: ' secreta ' })).toEqual({
      email: 'ada@pulse.app',
      password: ' secreta ',
    })
  })
})
