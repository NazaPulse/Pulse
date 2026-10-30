import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { findOwnedOrFail } from '../common/owned-records';
import { CreateNoteDto } from '../dto/notes/create-note.dto';
import { NoteResponseDto } from '../dto/notes/note-response.dto';
import { UpdateNoteDto } from '../dto/notes/update-note.dto';
import { Note } from '../models/note.entity';

const toResponse = (row: Note) => NoteResponseDto.fromEntity(row);
const newestFirst = { createdAt: 'DESC' } as const;

/**
 * Notas del usuario (más recientes primero). `update` es un reemplazo total:
 * `content`/`audio_url` omitidos o `null` quedan vacíos.
 */
@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notes: Repository<Note>,
  ) {}

  async findAllForUser(userId: string) {
    const rows = await this.notes.find({ where: { userId }, order: newestFirst });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateNoteDto) {
    const entity = this.notes.create({
      userId,
      title: dto.title,
      content: dto.content ?? null,
      audioUrl: dto.audio_url ?? null,
    });
    return toResponse(await this.notes.save(entity));
  }

  async findOneForUser(userId: string, id: string) {
    return toResponse(await findOwnedOrFail(this.notes, userId, id));
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    const note = await findOwnedOrFail(this.notes, userId, id);
    note.title = dto.title;
    note.content = dto.content ?? null;
    note.audioUrl = dto.audio_url ?? null;
    return toResponse(await this.notes.save(note));
  }

  async remove(userId: string, id: string): Promise<void> {
    const note = await findOwnedOrFail(this.notes, userId, id);
    await this.notes.remove(note);
  }
}
