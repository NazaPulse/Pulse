// Grabación de voz con `getUserMedia` + `MediaRecorder`, independiente del framework.
// El tiempo transcurrido se calcula con marcas reales (`Date.now()`) y el nivel de entrada
// se mide con un `AnalyserNode` de la Web Audio API. Cada frontend solo conecta `onChange`
// a su estado reactivo.

export type RecorderStatus = 'idle' | 'requesting' | 'recording'
export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unsupported'

/** Máximo por grabación: muy por debajo del límite de 10 MB del backend. */
export const MAX_RECORDING_MS = 10 * 60 * 1000

// En orden de preferencia; todos son formatos aceptados por el backend.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
const TICK_MS = 250

export interface RecorderSnapshot {
  status: RecorderStatus
  permission: MicPermission
  elapsedMs: number
  level: number
  error: string | null
}

export interface RecorderEvents {
  /** Cambios parciales del estado observable. */
  onChange: (patch: Partial<RecorderSnapshot>) => void
  /** Audio final al detener la grabación (no se invoca si se canceló). */
  onRecorded: (blob: Blob, durationMs: number) => void
}

export function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

export function initialRecorderSnapshot(): RecorderSnapshot {
  return {
    status: 'idle',
    permission: isRecordingSupported() ? 'unknown' : 'unsupported',
    elapsedMs: 0,
    level: 0,
    error: null,
  }
}

const GENERIC_MEDIA_ERROR = 'No se pudo acceder al micrófono.'
const PERMISSION_DENIED_MESSAGE = 'Permiso de micrófono denegado. Habilitalo desde la configuración del navegador.'
const MEDIA_ERROR_MESSAGES = new Map([
  ['NotAllowedError', PERMISSION_DENIED_MESSAGE],
  ['SecurityError', PERMISSION_DENIED_MESSAGE],
  ['NotFoundError', 'No se encontró ningún micrófono.'],
  ['NotReadableError', 'El micrófono está siendo usado por otra aplicación.'],
])

export function describeMediaError(error: unknown): string {
  const known = error instanceof DOMException ? MEDIA_ERROR_MESSAGES.get(error.name) : undefined
  return known ?? GENERIC_MEDIA_ERROR
}

export function permissionFromError(error: unknown): MicPermission {
  return error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unknown'
}

function permissionFromState(state: PermissionState): MicPermission {
  return state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'unknown'
}

/** Nivel de 0 a 1 a partir de las muestras de dominio temporal del `AnalyserNode`. */
export function levelFromSamples(samples: Uint8Array): number {
  let sum = 0
  for (const sample of samples) {
    const centered = (sample - 128) / 128
    sum += centered * centered
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 4)
}

/** Primer formato de {@link MIME_CANDIDATES} que soporta el navegador (o el que elija `MediaRecorder`). */
const supportedMimeType = () => MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))

const blobType = (recorder: MediaRecorder, mimeType: string | undefined) => recorder.mimeType || mimeType || 'audio/webm'

/** Permiso `microphone` si el navegador lo expone (Chrome, Firefox); `null` si no es consultable (Safari). */
async function queryMicPermission(): Promise<PermissionStatus | null> {
  if (!navigator.permissions?.query) return null
  try {
    return await navigator.permissions.query({ name: 'microphone' as PermissionName })
  } catch {
    return null
  }
}

/** Reporta el tiempo transcurrido desde `startedAt` cada {@link TICK_MS}; al llegar al máximo llama a `onLimit`. */
function startElapsedTicker(startedAt: number, onElapsed: (elapsedMs: number) => void, onLimit: () => void): number {
  return window.setInterval(() => {
    const elapsed = Date.now() - startedAt
    onElapsed(elapsed)
    if (elapsed >= MAX_RECORDING_MS) onLimit()
  }, TICK_MS)
}

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}

/** Medidor del nivel de entrada con un `AnalyserNode`; sin Web Audio queda en 0 y la grabación funciona igual. */
class LevelMeter {
  private context: AudioContext | null = null
  private frame: number | null = null

  start(media: MediaStream, onLevel: (level: number) => void): void {
    try {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(media).connect(analyser)
      this.context = context
      const samples = new Uint8Array(analyser.fftSize)
      const measure = () => {
        analyser.getByteTimeDomainData(samples)
        onLevel(levelFromSamples(samples))
        this.frame = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      /* sin Web Audio: nivel en 0 */
    }
  }

  /** Deja de medir (el contexto sigue abierto hasta `close`). */
  pause(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.frame = null
  }

  close(): void {
    void this.context?.close().catch(() => undefined)
    this.context = null
  }
}

/**
 * Grabación de una nota de voz. `watchPermission` refleja el estado del permiso cuando el
 * navegador lo expone y `requestPermission` lo solicita sin empezar a grabar. Al desmontar
 * (`dispose`) se descarta cualquier grabación en curso.
 */
export class AudioRecorder {
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private permissionStatus: PermissionStatus | null = null
  private chunks: Blob[] = []
  private startedAt = 0
  private tick: number | null = null
  private discard = false
  private readonly meter = new LevelMeter()
  private readonly events: RecorderEvents

  constructor(events: RecorderEvents) {
    this.events = events
  }

  async watchPermission(): Promise<void> {
    if (!isRecordingSupported()) return
    const result = await queryMicPermission()
    if (!result) return
    this.permissionStatus = result
    const sync = () => this.events.onChange({ permission: permissionFromState(result.state) })
    sync()
    result.onchange = sync
  }

  async requestPermission(): Promise<boolean> {
    if (!isRecordingSupported()) return false
    this.events.onChange({ error: null, status: 'requesting' })
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
      probe.getTracks().forEach((track) => track.stop())
      this.events.onChange({ permission: 'granted', status: 'idle' })
      return true
    } catch (err) {
      this.reportMediaError(err)
      return false
    }
  }

  stop(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop()
  }

  cancel(): void {
    this.discard = true
    this.stop()
  }

  async start(): Promise<void> {
    if (!isRecordingSupported() || this.recorder?.state === 'recording') return
    this.events.onChange({ error: null, status: 'requesting' })
    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      this.reportMediaError(err)
      return
    }
    this.stream = media
    this.events.onChange({ permission: 'granted' })
    this.beginRecording(media)
    this.meter.start(media, (level) => this.events.onChange({ level }))
  }

  dispose(): void {
    if (this.permissionStatus) this.permissionStatus.onchange = null
    this.discard = true
    this.stop()
    this.releaseResources()
  }

  private reportMediaError(err: unknown): void {
    this.events.onChange({ permission: permissionFromError(err), error: describeMediaError(err), status: 'idle' })
  }

  private beginRecording(media: MediaStream): void {
    const mimeType = supportedMimeType()
    const recorder = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
    this.recorder = recorder
    this.chunks = []
    this.discard = false

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data)
    }
    recorder.onstop = () => {
      const durationMs = Date.now() - this.startedAt
      this.finish(new Blob(this.chunks, { type: blobType(recorder, mimeType) }), durationMs)
    }

    this.startedAt = Date.now()
    recorder.start(1000)
    this.events.onChange({ elapsedMs: 0, status: 'recording' })
    this.tick = startElapsedTicker(
      this.startedAt,
      (elapsedMs) => this.events.onChange({ elapsedMs }),
      () => this.stop(),
    )
  }

  private finish(blob: Blob, durationMs: number): void {
    this.chunks = []
    this.recorder = null
    this.releaseResources()
    this.events.onChange({ status: 'idle' })
    if (!this.discard && blob.size > 0) this.events.onRecorded(blob, durationMs)
  }

  private releaseResources(): void {
    if (this.tick !== null) window.clearInterval(this.tick)
    this.tick = null
    this.meter.pause()
    stopTracks(this.stream)
    this.stream = null
    this.meter.close()
    this.events.onChange({ level: 0 })
  }
}
