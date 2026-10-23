import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AUDIO_PUBLIC_PREFIX, audioUploadOptions, MISSING_AUDIO_MESSAGE } from '../common/config/audio-upload.config';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AudioUploadExceptionFilter } from '../common/filters/audio-upload-exception.filter';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { AudioUploadResponseDto } from '../dto/notes/audio-upload-response.dto';
import { CreateNoteDto } from '../dto/notes/create-note.dto';
import { NoteResponseDto } from '../dto/notes/note-response.dto';
import { UpdateNoteDto } from '../dto/notes/update-note.dto';
import { NotesService } from '../services/notes.service';

/**
 * Rutas de Notas Multimedia (Issue #18). Reproduce `/api/notes`,
 * `/api/notes/upload-audio` y `/api/notes/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT y filtran por el usuario autenticado.
 */
@ApiProtected('Notes')
@Controller('api/notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listNotes',
    summary: 'Listar las notas del usuario autenticado',
    returns: {
      status: 'ok',
      type: NoteResponseDto,
      isArray: true,
      description: 'Listado de notas del usuario autenticado.',
    },
  })
  list(@CurrentUser() user: AuthenticatedUser): Promise<NoteResponseDto[]> {
    return this.notes.findAllForUser(user.id);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createNote',
    summary: 'Crear una nota (texto y/o audio)',
    returns: { status: 'created', type: NoteResponseDto, description: 'Nota creada correctamente.' },
    badRequest: true,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNoteDto): Promise<NoteResponseDto> {
    return this.notes.create(user.id, dto);
  }

  // Declarada antes de `:id` para que "upload-audio" no se tome como id.
  @Post('upload-audio')
  @UseFilters(AudioUploadExceptionFilter)
  @UseInterceptors(FileInterceptor('file', audioUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary', description: 'Archivo de audio a subir.' } },
    },
  })
  @ApiEndpoint({
    operationId: 'uploadNoteAudio',
    summary: 'Subir un archivo de voz para adjuntar a una nota',
    returns: { status: 'created', type: AudioUploadResponseDto, description: 'Archivo subido correctamente.' },
    badRequest: 'Archivo ausente, formato no soportado o tamaño mayor a 10 MB.',
  })
  uploadAudio(@UploadedFile() file: Express.Multer.File | undefined): AudioUploadResponseDto {
    if (!file) throw new BadRequestException(MISSING_AUDIO_MESSAGE);
    return { audio_url: `${AUDIO_PUBLIC_PREFIX}/${file.filename}` };
  }

  @Get(':id')
  @ApiEndpoint({
    operationId: 'getNoteById',
    summary: 'Obtener una nota por id',
    returns: { status: 'ok', type: NoteResponseDto, description: 'Nota encontrada.' },
    notFound: true,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NoteResponseDto> {
    return this.notes.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiEndpoint({
    operationId: 'updateNote',
    summary: 'Actualizar una nota existente',
    returns: { status: 'ok', type: NoteResponseDto, description: 'Nota actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notes.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiEndpoint({
    operationId: 'deleteNote',
    summary: 'Eliminar una nota',
    returns: { status: 'noContent', description: 'Nota eliminada correctamente. No retorna contenido.' },
    notFound: true,
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.notes.remove(user.id, id);
  }
}
