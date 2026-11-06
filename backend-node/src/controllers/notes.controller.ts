import { Body, Param, UploadedFile } from '@nestjs/common';
import { audioUrlOf } from '../common/config/audio-upload.config';
import type { UploadedAudio } from '../common/config/audio-upload.config';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateNoteDto } from '../dto/notes/create-note.dto';
import { UpdateNoteDto } from '../dto/notes/update-note.dto';
import { NotesService } from '../services/notes.service';
import { NotesRoutes } from './routes/notes.routes';

/** Notas del usuario autenticado: listado, alta y subida de audio (ver {@link NotesRoutes}). */
@NotesRoutes.controller
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @NotesRoutes.list
  list(@UserId() userId: string) {
    return this.notes.findAllForUser(userId);
  }

  @NotesRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateNoteDto) {
    return this.notes.create(userId, dto);
  }

  @NotesRoutes.uploadAudio
  uploadAudio(@UploadedFile() file: UploadedAudio) {
    return audioUrlOf(file);
  }
}

/** Una nota del usuario autenticado por `id` (ver {@link NotesRoutes}). */
@NotesRoutes.controller
export class NoteController {
  constructor(private readonly notes: NotesService) {}

  @NotesRoutes.findOne
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.notes.findOneForUser(userId, id);
  }

  @NotesRoutes.update
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(userId, id, dto);
  }

  @NotesRoutes.remove
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.notes.remove(userId, id);
  }
}
