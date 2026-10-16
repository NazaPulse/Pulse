import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

export type RecorderStatus = 'idle' | 'requesting' | 'recording'
export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unsupported'

/** Máximo por grabación: muy por debajo del límite de 10 MB del backend. */
export const MAX_RECORDING_MS = 10 * 60 * 1000

// En orden de preferencia; todos son formatos aceptados por el backend.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function pickMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

function describeMediaError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Permiso de micrófono denegado. Habilitalo desde la configuración del navegador.'
    }
    if (error.name === 'NotFoundError') return 'No se encontró ningún micrófono.'
    if (error.name === 'NotReadableError') return 'El micrófono está siendo usado por otra aplicación.'
  }
  return 'No se pudo acceder al micrófono.'
}

function permissionFromError(error: unknown): MicPermission {
  return error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unknown'
}

export interface UseAudioRecorderOptions {
  /** Se invoca con el audio final al detener la grabación. */
  onRecorded: (blob: Blob, durationMs: number) => void
}

export interface UseAudioRecorder {
  status: Ref<RecorderStatus>
  permission: Ref<MicPermission>
  elapsedMs: Ref<number>
  level: Ref<number>
  error: Ref<string | null>
  requestPermission: () => Promise<boolean>
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
}

/**
 * Grabación de voz con `getUserMedia` + `MediaRecorder`. El tiempo transcurrido
 * se calcula con marcas de tiempo reales (`Date.now()`), y el nivel de entrada
 * se mide con un `AnalyserNode` de la Web Audio API.
 */
export function useAudioRecorder({ onRecorded }: UseAudioRecorderOptions): UseAudioRecorder {
  const status = ref<RecorderStatus>('idle')
  const permission = ref<MicPermission>(isSupported() ? 'unknown' : 'unsupported')
  const elapsedMs = ref(0)
  const level = ref(0)
  const error = ref<string | null>(null)

  // Recursos del navegador: no necesitan reactividad.
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let chunks: Blob[] = []
  let startedAt = 0
  let tick: number | null = null
  let frame: number | null = null
  let discard = false
  let permissionStatus: PermissionStatus | null = null

  // Refleja el estado del permiso si el navegador lo expone (Chrome, Firefox).
  onMounted(() => {
    if (!isSupported() || !navigator.permissions?.query) return
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        permissionStatus = result
        const sync = () => {
          permission.value =
            result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown'
        }
        sync()
        result.onchange = sync
      })
      .catch(() => {
        /* `microphone` no es consultable en este navegador (Safari): se pregunta al grabar. */
      })
  })

  function releaseResources() {
    if (tick !== null) window.clearInterval(tick)
    if (frame !== null) cancelAnimationFrame(frame)
    tick = null
    frame = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    void audioContext?.close().catch(() => undefined)
    audioContext = null
    level.value = 0
  }

  onBeforeUnmount(() => {
    // Al desmontar se descarta cualquier grabación en curso.
    if (permissionStatus) permissionStatus.onchange = null
    discard = true
    if (recorder?.state === 'recording') recorder.stop()
    releaseResources()
  })

  /** Solicita el permiso del micrófono sin empezar a grabar. */
  async function requestPermission(): Promise<boolean> {
    if (!isSupported()) return false
    error.value = null
    status.value = 'requesting'
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
      probe.getTracks().forEach((track) => track.stop())
      permission.value = 'granted'
      return true
    } catch (err) {
      permission.value = permissionFromError(err)
      error.value = describeMediaError(err)
      return false
    } finally {
      status.value = 'idle'
    }
  }

  function stop() {
    if (recorder?.state === 'recording') recorder.stop()
  }

  function cancel() {
    discard = true
    stop()
  }

  function startLevelMeter(source: MediaStream) {
    try {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(source).connect(analyser)
      audioContext = context
      const samples = new Uint8Array(analyser.fftSize)
      const measure = () => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (const sample of samples) {
          const centered = (sample - 128) / 128
          sum += centered * centered
        }
        level.value = Math.min(1, Math.sqrt(sum / samples.length) * 4)
        frame = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      /* Sin Web Audio el medidor queda en 0; la grabación funciona igual. */
    }
  }

  async function start() {
    if (!isSupported() || recorder?.state === 'recording') return
    error.value = null
    status.value = 'requesting'

    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      permission.value = permissionFromError(err)
      error.value = describeMediaError(err)
      status.value = 'idle'
      return
    }
    permission.value = 'granted'
    stream = media

    const mimeType = pickMimeType()
    const current = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
    recorder = current
    chunks = []
    discard = false

    current.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    current.onstop = () => {
      const durationMs = Date.now() - startedAt
      const blob = new Blob(chunks, { type: current.mimeType || mimeType || 'audio/webm' })
      chunks = []
      recorder = null
      releaseResources()
      status.value = 'idle'
      if (!discard && blob.size > 0) onRecorded(blob, durationMs)
    }

    startLevelMeter(media)

    startedAt = Date.now()
    elapsedMs.value = 0
    current.start(1000)
    status.value = 'recording'

    tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      elapsedMs.value = elapsed
      if (elapsed >= MAX_RECORDING_MS) stop()
    }, 250)
  }

  return { status, permission, elapsedMs, level, error, requestPermission, start, stop, cancel }
}
