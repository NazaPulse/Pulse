import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notes: Repository<Note>,
  ) {}

  async findAllForUser(userId: string): Promise<NoteResponseDto[]> {
    const rows = await this.notes.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => NoteResponseDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const entity = this.notes.create({
      userId,
      title: dto.title,
      content: dto.content ?? null,
      audioUrl: dto.audio_url ?? null,
    });
    const saved = await this.notes.save(entity);
    return NoteResponseDto.fromEntity(saved);
  }

  async findOneForUser(userId: string, id: string): Promise<NoteResponseDto> {
    const note = await this.findOwnedOrFail(userId, id);
    return NoteResponseDto.fromEntity(note);
  }

  /** Reemplazo total: `content`/`audio_url` omitidos o `null` quedan vacíos. */
  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<NoteResponseDto> {
    const note = await this.findOwnedOrFail(userId, id);
    note.title = dto.title;
    note.content = dto.content ?? null;
    note.audioUrl = dto.audio_url ?? null;
    const saved = await this.notes.save(note);
    return NoteResponseDto.fromEntity(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const note = await this.findOwnedOrFail(userId, id);
    await this.notes.remove(note);
  }

  /**
   * Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
   * formato inválido) responde `404` — nunca revela si existe para otro.
   */
  private async findOwnedOrFail(userId: string, id: string): Promise<Note> {
    if (!isUUID(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const note = await this.notes.findOne({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return note;
  }
}
