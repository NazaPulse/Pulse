import { useEffect, useRef, useState } from 'react'

import { AudioRecorder, initialRecorderSnapshot } from '@shared/audioRecorder'
import type { RecorderSnapshot } from '@shared/audioRecorder'

type UseAudioRecorderOptions = {
  /** Se invoca con el audio final al detener la grabación. */
  onRecorded: (blob: Blob, durationMs: number) => void
}

export function useAudioRecorder({ onRecorded }: UseAudioRecorderOptions) {
  const [snapshot, setSnapshot] = useState<RecorderSnapshot>(initialRecorderSnapshot)
  const onRecordedRef = useRef(onRecorded)
  const [recorder] = useState(
    () =>
      new AudioRecorder({
        onChange: (patch) => setSnapshot((prev) => ({ ...prev, ...patch })),
        onRecorded: (blob, durationMs) => onRecordedRef.current(blob, durationMs),
      }),
  )

  useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  useEffect(() => {
    void recorder.watchPermission()
    return () => recorder.dispose()
  }, [recorder])

  return {
    ...snapshot,
    requestPermission: () => recorder.requestPermission(),
    start: () => recorder.start(),
    stop: () => recorder.stop(),
    cancel: () => recorder.cancel(),
  }
}

export type AudioRecorderState = ReturnType<typeof useAudioRecorder>
