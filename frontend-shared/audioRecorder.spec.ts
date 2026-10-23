import {
  AudioRecorder,
  describeMediaError,
  initialRecorderSnapshot,
  levelFromSamples,
  permissionFromError,
} from './audioRecorder'

const domError = (name: string) => new DOMException('x', name)

describe('mensajes y permisos', () => {
  it.each([
    ['NotAllowedError', 'Permiso de micrófono denegado'],
    ['SecurityError', 'Permiso de micrófono denegado'],
    ['NotFoundError', 'No se encontró ningún micrófono'],
    ['NotReadableError', 'usado por otra aplicación'],
  ])('describeMediaError(%s)', (name, text) => {
    expect(describeMediaError(domError(name))).toContain(text)
  })

  it('cualquier otro error usa el mensaje genérico', () => {
    expect(describeMediaError(new Error('raro'))).toBe('No se pudo acceder al micrófono.')
  })

  it('solo NotAllowedError marca el permiso como denegado', () => {
    expect(permissionFromError(domError('NotAllowedError'))).toBe('denied')
    expect(permissionFromError(domError('NotFoundError'))).toBe('unknown')
    expect(permissionFromError('x')).toBe('unknown')
  })
})

describe('nivel de entrada', () => {
  it('el silencio (128) da 0 y una señal fuerte se satura en 1', () => {
    expect(levelFromSamples(new Uint8Array([128, 128, 128, 128]))).toBe(0)
    expect(levelFromSamples(new Uint8Array([0, 255, 0, 255]))).toBe(1)
  })
})

describe('entorno sin micrófono', () => {
  it('el estado inicial indica "unsupported" y no hay operaciones activas', async () => {
    const snapshot = initialRecorderSnapshot()
    expect(snapshot).toEqual({ status: 'idle', permission: 'unsupported', elapsedMs: 0, level: 0, error: null })

    const onChange = vi.fn()
    const recorder = new AudioRecorder({ onChange, onRecorded: vi.fn() })
    await recorder.watchPermission()
    await recorder.start()
    expect(await recorder.requestPermission()).toBe(false)
    recorder.cancel()
    recorder.dispose()
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'recording' }))
  })
})
