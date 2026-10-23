import { onBeforeUnmount, onMounted, reactive, toRefs } from 'vue'

import { AudioRecorder, initialRecorderSnapshot } from '@shared/audioRecorder'

interface UseAudioRecorderOptions {
  /** Se invoca con el audio final al detener la grabación. */
  onRecorded: (blob: Blob, durationMs: number) => void
}

export function useAudioRecorder({ onRecorded }: UseAudioRecorderOptions) {
  const snapshot = reactive(initialRecorderSnapshot())
  const recorder = new AudioRecorder({
    onChange: (patch) => Object.assign(snapshot, patch),
    onRecorded,
  })

  onMounted(() => void recorder.watchPermission())
  onBeforeUnmount(() => recorder.dispose())

  return {
    ...toRefs(snapshot),
    requestPermission: () => recorder.requestPermission(),
    start: () => recorder.start(),
    stop: () => recorder.stop(),
    cancel: () => recorder.cancel(),
  }
}

export type AudioRecorderState = ReturnType<typeof useAudioRecorder>
