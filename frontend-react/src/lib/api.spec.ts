import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'

import { extractErrorMessage } from './api'

const CONFIG = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

function httpError(status: number, data: unknown): AxiosError {
  const response: AxiosResponse = { status, statusText: '', data, headers: {}, config: CONFIG }
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', CONFIG, null, response)
}

describe('extractErrorMessage', () => {
  it('une los mensajes de validación (message: string[])', () => {
    const error = httpError(400, { message: ['email must be an email', 'password should not be empty'] })
    expect(extractErrorMessage(error)).toBe('email must be an email · password should not be empty')
  })

  it('devuelve el mensaje de negocio (message: string)', () => {
    expect(extractErrorMessage(httpError(400, { message: 'Saldo insuficiente en la cuenta' }))).toBe(
      'Saldo insuficiente en la cuenta',
    )
  })

  it('401 sin mensaje útil -> credenciales incorrectas', () => {
    expect(extractErrorMessage(httpError(401, { message: '   ' }))).toBe('Credenciales incorrectas.')
  })

  it('sin cuerpo útil informa el código HTTP', () => {
    expect(extractErrorMessage(httpError(500, undefined))).toBe('Error 500.')
    expect(extractErrorMessage(httpError(404, { message: [] }))).toBe('Error 404.')
  })

  it('timeout y falta de conexión', () => {
    expect(extractErrorMessage(new AxiosError('t', 'ECONNABORTED'))).toBe('La solicitud tardó demasiado.')
    expect(extractErrorMessage(new AxiosError('n', 'ERR_NETWORK'))).toBe('No se pudo conectar con el servidor.')
  })

  it('errores que no son de Axios usan el fallback', () => {
    expect(extractErrorMessage(new Error('x'))).toBe('Ocurrió un error. Intentá nuevamente.')
    expect(extractErrorMessage('x', 'No se pudo guardar.')).toBe('No se pudo guardar.')
  })
})
