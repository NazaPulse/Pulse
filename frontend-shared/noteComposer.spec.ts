import { buildNotePayload, phaseLabel, saveNoteDraft } from './noteComposer'
import type { NoteDraft, NotesClient, SavePhase } from './noteComposer'

const NOW = new Date('2026-10-20T15:30:00Z')
const note = { id: 'n1' } as never

function fakeClient() {
  const calls: string[] = []
  const client: NotesClient = {
    uploadAudioNote: async () => {
      calls.push('upload')
      return { audio_url: '/uploads/audio/a.webm' }
    },
    createNote: async (payload) => {
      calls.push(`create:${JSON.stringify(payload)}`)
      return note
    },
  }
  return { client, calls }
}

describe('buildNotePayload', () => {
  it('recorta título y contenido y omite lo vacío', () => {
    const draft: NoteDraft = { title: '  Idea ', content: '   ', audio: null }
    expect(buildNotePayload(draft, undefined, NOW)).toEqual({ title: 'Idea' })
  })

  it('una nota de voz sin título usa uno con la fecha', () => {
    const draft: NoteDraft = { title: '', content: ' texto ', audio: new Blob(['x']) }
    const payload = buildNotePayload(draft, '/uploads/audio/a.webm', NOW)
    expect(payload.title).toMatch(/^Nota de voz · /)
    expect(payload).toMatchObject({ content: 'texto', audio_url: '/uploads/audio/a.webm' })
  })

  it('una nota de texto sin título queda vacía (la UI no permite guardarla)', () => {
    expect(buildNotePayload({ title: '', content: '', audio: null }, undefined, NOW).title).toBe('')
  })
})

describe('saveNoteDraft', () => {
  it('sin audio solo crea la nota', async () => {
    const { client, calls } = fakeClient()
    const phases: SavePhase[] = []
    await expect(saveNoteDraft(client, { title: 'A', content: '', audio: null }, (p) => phases.push(p))).resolves.toBe(note)
    expect(phases).toEqual(['saving'])
    expect(calls).toEqual(['create:{"title":"A"}'])
  })

  it('con audio lo sube primero y guarda la `audio_url`', async () => {
    const { client, calls } = fakeClient()
    const phases: SavePhase[] = []
    await saveNoteDraft(client, { title: 'V', content: '', audio: new Blob(['x']) }, (p) => phases.push(p))
    expect(phases).toEqual(['uploading', 'saving'])
    expect(calls[0]).toBe('upload')
    expect(calls[1]).toContain('"audio_url":"/uploads/audio/a.webm"')
  })

  it('si la subida falla no se crea la nota', async () => {
    const { client, calls } = fakeClient()
    client.uploadAudioNote = async () => {
      throw new Error('red')
    }
    await expect(saveNoteDraft(client, { title: 'V', content: '', audio: new Blob(['x']) }, () => {})).rejects.toThrow('red')
    expect(calls).toEqual([])
  })
})

describe('textos', () => {
  it('etiqueta de cada fase', () => {
    expect(phaseLabel('uploading')).toBe('Subiendo audio…')
    expect(phaseLabel('saving')).toBe('Guardando nota…')
  })
})
