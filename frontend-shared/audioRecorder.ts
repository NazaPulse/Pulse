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

export function describeMediaError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Permiso de micrófono denegado. Habilitalo desde la configuración del navegador.'
    }
    if (error.name === 'NotFoundError') return 'No se encontró ningún micrófono.'
    if (error.name === 'NotReadableError') return 'El micrófono está siendo usado por otra aplicación.'
  }
  return 'No se pudo acceder al micrófono.'
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

export class AudioRecorder {
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private permissionStatus: PermissionStatus | null = null
  private chunks: Blob[] = []
  private startedAt = 0
  private tick: number | null = null
  private frame: number | null = null
  private discard = false
  private readonly events: RecorderEvents

  constructor(events: RecorderEvents) {
    this.events = events
  }

  /** Refleja el estado del permiso si el navegador lo expone (Chrome, Firefox). */
  async watchPermission(): Promise<void> {
    if (!isRecordingSupported() || !navigator.permissions?.query) return
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      this.permissionStatus = result
      const sync = () => this.events.onChange({ permission: permissionFromState(result.state) })
      sync()
      result.onchange = sync
    } catch {
      /* `microphone` no es consultable en este navegador (Safari): se pregunta al grabar. */
    }
  }

  /** Solicita el permiso del micrófono sin empezar a grabar. */
  async requestPermission(): Promise<boolean> {
    if (!isRecordingSupported()) return false
    this.events.onChange({ error: null, status: 'requesting' })
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
      probe.getTracks().forEach((track) => track.stop())
      this.events.onChange({ permission: 'granted', status: 'idle' })
      return true
    } catch (err) {
      this.events.onChange({ permission: permissionFromError(err), error: describeMediaError(err), status: 'idle' })
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
      this.events.onChange({ permission: permissionFromError(err), error: describeMediaError(err), status: 'idle' })
      return
    }
    this.stream = media
    this.events.onChange({ permission: 'granted' })
    this.beginRecording(media)
    this.startLevelMeter(media)
  }

  /** Al desmontar se descarta cualquier grabación en curso. */
  dispose(): void {
    if (this.permissionStatus) this.permissionStatus.onchange = null
    this.discard = true
    this.stop()
    this.releaseResources()
  }

  private beginRecording(media: MediaStream): void {
    const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
    const recorder = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
    this.recorder = recorder
    this.chunks = []
    this.discard = false

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data)
    }
    recorder.onstop = () => {
      const durationMs = Date.now() - this.startedAt
      const blob = new Blob(this.chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      this.chunks = []
      this.recorder = null
      this.releaseResources()
      this.events.onChange({ status: 'idle' })
      if (!this.discard && blob.size > 0) this.events.onRecorded(blob, durationMs)
    }

    this.startedAt = Date.now()
    recorder.start(1000)
    this.events.onChange({ elapsedMs: 0, status: 'recording' })
    this.tick = window.setInterval(() => {
      const elapsed = Date.now() - this.startedAt
      this.events.onChange({ elapsedMs: elapsed })
      if (elapsed >= MAX_RECORDING_MS) this.stop()
    }, TICK_MS)
  }

  /** Medidor de nivel de entrada; sin Web Audio queda en 0 y la grabación funciona igual. */
  private startLevelMeter(media: MediaStream): void {
    try {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(media).connect(analyser)
      this.audioContext = context
      const samples = new Uint8Array(analyser.fftSize)
      const measure = () => {
        analyser.getByteTimeDomainData(samples)
        this.events.onChange({ level: levelFromSamples(samples) })
        this.frame = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      /* sin Web Audio: nivel en 0 */
    }
  }

  private releaseResources(): void {
    if (this.tick !== null) window.clearInterval(this.tick)
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.tick = null
    this.frame = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    void this.audioContext?.close().catch(() => undefined)
    this.audioContext = null
    this.events.onChange({ level: 0 })
  }
}
