import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AudioUploadExceptionFilter } from './audio-upload-exception.filter';
import { AUDIO_PUBLIC_PREFIX, audioUploadOptions, MISSING_AUDIO_MESSAGE } from './audio-upload.config';
import { AudioUploadResponseDto } from './dto/audio-upload-response.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

/**
 * Rutas de Notas Multimedia (Issue #18). Reproduce `/api/notes`,
 * `/api/notes/upload-audio` y `/api/notes/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT y filtran por el usuario autenticado.
 */
@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  @ApiOperation({ operationId: 'listNotes', summary: 'Listar las notas del usuario autenticado' })
  @ApiOkResponse({ type: NoteResponseDto, isArray: true, description: 'Listado de notas del usuario autenticado.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<NoteResponseDto[]> {
    return this.notes.findAllForUser(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createNote', summary: 'Crear una nota (texto y/o audio)' })
  @ApiCreatedResponse({ type: NoteResponseDto, description: 'Nota creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notes.create(user.id, dto);
  }

  // Declarada antes de `:id` para que "upload-audio" no se tome como id.
  @Post('upload-audio')
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(AudioUploadExceptionFilter)
  @UseInterceptors(FileInterceptor('file', audioUploadOptions))
  @ApiOperation({ operationId: 'uploadNoteAudio', summary: 'Subir un archivo de voz para adjuntar a una nota' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary', description: 'Archivo de audio a subir.' } },
    },
  })
  @ApiCreatedResponse({ type: AudioUploadResponseDto, description: 'Archivo subido correctamente.' })
  @ApiBadRequestResponse({ description: 'Archivo ausente, formato no soportado o tamaño mayor a 10 MB.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  uploadAudio(@UploadedFile() file: Express.Multer.File | undefined): AudioUploadResponseDto {
    if (!file) {
      throw new BadRequestException(MISSING_AUDIO_MESSAGE);
    }
    return { audio_url: `${AUDIO_PUBLIC_PREFIX}/${file.filename}` };
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getNoteById', summary: 'Obtener una nota por id' })
  @ApiOkResponse({ type: NoteResponseDto, description: 'Nota encontrada.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NoteResponseDto> {
    return this.notes.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ operationId: 'updateNote', summary: 'Actualizar una nota existente' })
  @ApiOkResponse({ type: NoteResponseDto, description: 'Nota actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notes.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteNote', summary: 'Eliminar una nota' })
  @ApiNoContentResponse({ description: 'Nota eliminada correctamente. No retorna contenido.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.notes.remove(user.id, id);
  }
}
