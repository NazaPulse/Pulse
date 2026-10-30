import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { useSubmission } from './useSubmission'

describe('useSubmission', () => {
  it('éxito: limpia el error y, por defecto, deja el botón bloqueado (el modal se cierra)', async () => {
    const { submitting, error, submit } = useSubmission('fallback')
    error.value = 'previo'
    await submit(async () => {
      expect(submitting.value).toBe(true)
      expect(error.value).toBeNull()
    })
    expect(submitting.value).toBe(true)
  })

  it('éxito con resetOnSuccess: libera el botón', async () => {
    const { submitting, submit } = useSubmission('fallback')
    await submit(async () => undefined, { resetOnSuccess: true })
    expect(submitting.value).toBe(false)
  })

  it('error: muestra el mensaje normalizado y libera el botón', async () => {
    const { submitting, error, submit } = useSubmission('No se pudo guardar.')
    await submit(async () => {
      throw new AxiosError('t', 'ECONNABORTED')
    })
    expect(error.value).toBe('La solicitud tardó demasiado.')
    expect(submitting.value).toBe(false)
  })
})

describe('useSubmission', () => {
  it('error que no es de Axios: usa el fallback', async () => {
    const { error, submit } = useSubmission('No se pudo guardar.')
    await submit(async () => {
      throw new Error('boom')
    })
    expect(error.value).toBe('No se pudo guardar.')
  })
})
