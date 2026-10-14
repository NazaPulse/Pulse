import { useCallback, useEffect, useRef, useState } from 'react'

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

type UseAudioRecorderOptions = {
  /** Se invoca con el audio final al detener la grabación. */
  onRecorded: (blob: Blob, durationMs: number) => void
}

/**
 * Grabación de voz con `getUserMedia` + `MediaRecorder`. El tiempo transcurrido
 * se calcula con marcas de tiempo reales (`Date.now()`), y el nivel de entrada
 * se mide con un `AnalyserNode` de la Web Audio API.
 */
export function useAudioRecorder({ onRecorded }: UseAudioRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [permission, setPermission] = useState<MicPermission>(() =>
    isSupported() ? 'unknown' : 'unsupported',
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const tickRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const discardRef = useRef(false)
  const onRecordedRef = useRef(onRecorded)

  useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  // Refleja el estado del permiso si el navegador lo expone (Chrome, Firefox).
  useEffect(() => {
    if (!isSupported() || !navigator.permissions?.query) return
    let cancelled = false
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (cancelled) return
        const sync = () =>
          setPermission(
            result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown',
          )
        sync()
        result.onchange = sync
      })
      .catch(() => {
        /* `microphone` no es consultable en este navegador (Safari): se pregunta al grabar. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const releaseResources = useCallback(() => {
    if (tickRef.current !== null) window.clearInterval(tickRef.current)
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    tickRef.current = null
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close().catch(() => undefined)
    audioContextRef.current = null
    setLevel(0)
  }, [])

  useEffect(() => {
    return () => {
      // Al desmontar se descarta cualquier grabación en curso.
      discardRef.current = true
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      releaseResources()
    }
  }, [releaseResources])

  /** Solicita el permiso del micrófono sin empezar a grabar. */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false
    setError(null)
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermission('granted')
      return true
    } catch (err) {
      setPermission(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'unknown')
      setError(describeMediaError(err))
      return false
    } finally {
      setStatus('idle')
    }
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const cancel = useCallback(() => {
    discardRef.current = true
    stop()
  }, [stop])

  const start = useCallback(async () => {
    if (!isSupported() || recorderRef.current?.state === 'recording') return
    setError(null)
    setStatus('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      setPermission(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'unknown')
      setError(describeMediaError(err))
      setStatus('idle')
      return
    }
    setPermission('granted')
    streamRef.current = stream

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    chunksRef.current = []
    discardRef.current = false

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
      chunksRef.current = []
      recorderRef.current = null
      releaseResources()
      setStatus('idle')
      if (!discardRef.current && blob.size > 0) onRecordedRef.current(blob, durationMs)
    }

    // Medidor de nivel de entrada (Web Audio API).
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      audioContext.createMediaStreamSource(stream).connect(analyser)
      audioContextRef.current = audioContext
      const samples = new Uint8Array(analyser.fftSize)
      const measure = () => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (const sample of samples) {
          const centered = (sample - 128) / 128
          sum += centered * centered
        }
        setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 4))
        frameRef.current = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      /* Sin Web Audio el medidor queda en 0; la grabación funciona igual. */
    }

    startedAtRef.current = Date.now()
    setElapsedMs(0)
    recorder.start(1000)
    setStatus('recording')

    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      setElapsedMs(elapsed)
      if (elapsed >= MAX_RECORDING_MS) stop()
    }, 250)
  }, [releaseResources, stop])

  return { status, permission, elapsedMs, level, error, requestPermission, start, stop, cancel }
}
