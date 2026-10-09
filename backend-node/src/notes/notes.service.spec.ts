import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { NotesService } from './notes.service';

/**
 * Issue #18 — Notas multimedia:
 *  - list filtra siempre por userId.
 *  - PUT es reemplazo total: content/audio_url omitidos quedan en null.
 *  - Recurso de otro usuario / inexistente / id inválido -> 404.
 */
describe('NotesService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const OTHER_USER_ID = '9a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9';
  const NOTE_ID = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a';
  const AUDIO_URL = '/uploads/audio/5f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f.webm';

  const buildNote = (over: Partial<Note> = {}): Note =>
    Object.assign(new Note(), {
      id: NOTE_ID,
      userId: OWNER_ID,
      title: 'Ideas de ahorro',
      content: 'Revisar suscripciones',
      audioUrl: AUDIO_URL,
      createdAt: new Date('2026-10-07T12:00:00.000Z'),
      updatedAt: new Date('2026-10-07T12:00:00.000Z'),
      ...over,
    });

  let repo: jest.Mocked<Pick<Repository<Note>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
  let service: NotesService;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v) => Object.assign(new Note(), v)) as never,
      save: jest.fn(async (v) => Object.assign(buildNote(), v)) as never,
      remove: jest.fn(),
    };
    service = new NotesService(repo as unknown as Repository<Note>);
  });

  it('findAllForUser filtra por userId y mapea al contrato', async () => {
    repo.find.mockResolvedValue([buildNote()]);

    const result = await service.findAllForUser(OWNER_ID);

    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: OWNER_ID } }));
    expect(result).toEqual([
      {
        id: NOTE_ID,
        title: 'Ideas de ahorro',
        content: 'Revisar suscripciones',
        audio_url: AUDIO_URL,
        user_id: OWNER_ID,
        created_at: '2026-10-07T12:00:00.000Z',
        updated_at: '2026-10-07T12:00:00.000Z',
      },
    ]);
  });

  it('create guarda audio_url y content null si no se envía', async () => {
    await service.create(OWNER_ID, { title: 'Voz', audio_url: AUDIO_URL });

    expect(repo.create).toHaveBeenCalledWith({
      userId: OWNER_ID,
      title: 'Voz',
      content: null,
      audioUrl: AUDIO_URL,
    });
  });

  it('update es reemplazo total: campos omitidos quedan en null', async () => {
    repo.findOne.mockResolvedValue(buildNote());

    await service.update(OWNER_ID, NOTE_ID, { title: 'Nuevo título' });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nuevo título', content: null, audioUrl: null }),
    );
  });

  describe('aislamiento por usuario', () => {
    it('findOneForUser -> 404 si la nota es de otro usuario', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser(OTHER_USER_ID, NOTE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: NOTE_ID, userId: OTHER_USER_ID } });
    });

    it('update de otro usuario -> 404 y no guarda', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(OTHER_USER_ID, NOTE_ID, { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('remove con id no UUID -> 404 sin tocar la DB', async () => {
      await expect(service.remove(OWNER_ID, 'upload-audio')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne).not.toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
