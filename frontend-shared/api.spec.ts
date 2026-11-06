import { createApi, createHttp, extractErrorMessage, resolveMediaUrl } from './api'
import { audioFileName } from './productivityApi'
import type { HttpClient } from './api'

function fakeHttp() {
  const calls: unknown[][] = []
  const respond = (method: string) => async (...args: unknown[]) => {
    calls.push([method, ...args])
    return { data: `${method}-data` }
  }
  const http = {
    get: respond('get'),
    post: respond('post'),
    put: respond('put'),
    patch: respond('patch'),
    delete: respond('delete'),
  } as unknown as HttpClient
  return { http, calls }
}

function httpError(status: number, data: unknown) {
  return { isAxiosError: true, code: 'ERR_BAD_RESPONSE', response: { status, data } }
}

describe('createApi', () => {
  it('auth y cuentas usan el método y la ruta de openapi.yaml', async () => {
    const { http, calls } = fakeHttp()
    const api = createApi(http)
    const body = { any: 'payload' }
    await api.registerRequest(body as never)
    await api.loginRequest(body as never)
    await api.getAccounts()
    await api.createAccount(body as never)
    await api.updateAccount('a1', body as never)
    await api.deleteAccount('a1')
    expect(calls).toEqual([
      ['post', '/api/auth/register', body],
      ['post', '/api/auth/login', body],
      ['get', '/api/accounts'],
      ['post', '/api/accounts', body],
      ['put', '/api/accounts/a1', body],
      ['delete', '/api/accounts/a1'],
    ])
  })
})

describe('createApi', () => {
  it('sobres, transacciones y resumen usan el método y la ruta de openapi.yaml', async () => {
    const { http, calls } = fakeHttp()
    const api = createApi(http)
    const body = { any: 'payload' }
    await api.getCategories()
    await api.createCategory(body as never)
    await api.updateCategory('c1', body as never)
    await api.deleteCategory('c1')
    await api.createTransaction(body as never)
    await api.getFinanceSummary()
    expect(calls).toEqual([
      ['get', '/api/categories'],
      ['post', '/api/categories', body],
      ['put', '/api/categories/c1', body],
      ['delete', '/api/categories/c1'],
      ['post', '/api/transactions', body],
      ['get', '/api/finances/summary'],
    ])
  })
})

describe('createApi', () => {
  it('devuelve el `data` de la respuesta y `void` en los borrados', async () => {
    const api = createApi(fakeHttp().http)
    await expect(api.getAccounts()).resolves.toBe('get-data')
    await expect(api.deleteAccount('a1')).resolves.toBeUndefined()
  })

  it('getTransactions omite los filtros vacíos', async () => {
    const { http, calls } = fakeHttp()
    await createApi(http).getTransactions({ account_id: 'a1', category_id: '', type: undefined })
    await createApi(http).getTransactions()
    expect(calls).toEqual([
      ['get', '/api/transactions', { params: { account_id: 'a1' } }],
      ['get', '/api/transactions', { params: {} }],
    ])
  })
})

describe('API de productividad', () => {
  it('cada operación usa el método y la ruta de openapi.yaml', async () => {
    const { http, calls } = fakeHttp()
    const api = createApi(http)
    const body = { any: 'payload' }
    await api.getTasks({ status: 'pending', priority: undefined })
    await api.createTask(body as never)
    await api.updateTask('t1', body as never)
    await api.deleteTask('t1')
    await api.getNotes()
    await api.createNote(body as never)
    await api.deleteNote('n1')
    expect(calls).toEqual([
      ['get', '/api/tasks', { params: { status: 'pending' } }],
      ['post', '/api/tasks', body],
      ['patch', '/api/tasks/t1', body],
      ['delete', '/api/tasks/t1'],
      ['get', '/api/notes'],
      ['post', '/api/notes', body],
      ['delete', '/api/notes/n1'],
    ])
  })
})

describe('API de productividad', () => {
  it('uploadAudioNote envía multipart con timeout propio y nombre según el MIME', async () => {
    const { http, calls } = fakeHttp()
    const blob = new Blob(['x'], { type: 'audio/mp4;codecs=opus' })
    await createApi(http).uploadAudioNote(blob)
    const [method, url, form, config] = calls[0] as [string, string, FormData, Record<string, unknown>]
    expect([method, url]).toEqual(['post', '/api/notes/upload-audio'])
    expect((form.get('file') as File).name).toBe('nota-de-voz.m4a')
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 })
  })

  it('audioFileName usa webm si el tipo es desconocido', () => {
    expect(audioFileName(new Blob([''], { type: '' }))).toBe('nota-de-voz.webm')
  })
})

describe('createHttp y resolveMediaUrl', () => {
  it('crea la instancia con base, JSON y timeout', () => {
    const create = vi.fn(() => 'instancia')
    expect(createHttp({ create }, '  http://api  ')).toBe('instancia')
    expect(create).toHaveBeenCalledWith({
      baseURL: 'http://api',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    })
    createHttp({ create }, undefined)
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ baseURL: '' }))
  })

  it('resolveMediaUrl respeta URLs absolutas y antepone la base a las relativas', () => {
    expect(resolveMediaUrl('http://api', '/uploads/a.webm')).toBe('http://api/uploads/a.webm')
    expect(resolveMediaUrl('http://api', 'https://cdn/a.webm')).toBe('https://cdn/a.webm')
  })
})

describe('extractErrorMessage', () => {
  it('une los mensajes de validación y respeta el mensaje de negocio', () => {
    expect(extractErrorMessage(httpError(400, { message: ['a', 'b'] }))).toBe('a · b')
    expect(extractErrorMessage(httpError(400, { message: 'Saldo insuficiente en la cuenta' }))).toBe(
      'Saldo insuficiente en la cuenta',
    )
  })

  it('sin mensaje útil: 401 -> credenciales; otro -> código HTTP', () => {
    expect(extractErrorMessage(httpError(401, { message: '  ' }))).toBe('Credenciales incorrectas.')
    expect(extractErrorMessage(httpError(404, { message: [] }))).toBe('Error 404.')
    expect(extractErrorMessage(httpError(500, undefined))).toBe('Error 500.')
  })

  it('sin respuesta: timeout o falta de conexión', () => {
    expect(extractErrorMessage({ isAxiosError: true, code: 'ECONNABORTED' })).toBe('La solicitud tardó demasiado.')
    expect(extractErrorMessage({ isAxiosError: true, code: 'ERR_NETWORK' })).toBe('No se pudo conectar con el servidor.')
  })

  it('cualquier otra cosa usa el fallback', () => {
    expect(extractErrorMessage(new Error('x'))).toBe('Ocurrió un error. Intentá nuevamente.')
    expect(extractErrorMessage(null, 'fb')).toBe('fb')
    expect(extractErrorMessage({ isAxiosError: 'true' }, 'fb')).toBe('fb')
  })
})
