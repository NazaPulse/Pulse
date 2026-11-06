import { applyDecorators, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { audioUploadOptions } from '../../common/config/audio-upload.config';
import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { AudioUploadExceptionFilter } from '../../common/filters/audio-upload-exception.filter';
import { AudioUploadResponseDto } from '../../dto/notes/audio-upload-response.dto';
import { NoteResponseDto } from '../../dto/notes/note-response.dto';

/**
 * Rutas de Notas Multimedia (Issue #18). Reproduce `/api/notes`,
 * `/api/notes/upload-audio` y `/api/notes/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT y filtran por el usuario autenticado.
 */
export const NotesRoutes = {
  controller: ApiResource('Notes', 'api/notes'),
  list: ApiRoute('get', undefined, {
    operationId: 'listNotes',
    summary: 'Listar las notas del usuario autenticado',
    returns: {
      status: 'ok',
      type: NoteResponseDto,
      isArray: true,
      description: 'Listado de notas del usuario autenticado.',
    },
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createNote',
    summary: 'Crear una nota (texto y/o audio)',
    returns: { status: 'created', type: NoteResponseDto, description: 'Nota creada correctamente.' },
    badRequest: true,
  }),
  /**
   * Archivo multipart en el campo `file`; los errores de Multer se traducen a `400`. Su
   * controlador se registra antes que las rutas `:id` para que "upload-audio" no se tome como id.
   */
  uploadAudio: applyDecorators(
    ApiRoute('post', 'upload-audio', {
      operationId: 'uploadNoteAudio',
      summary: 'Subir un archivo de voz para adjuntar a una nota',
      returns: { status: 'created', type: AudioUploadResponseDto, description: 'Archivo subido correctamente.' },
      badRequest: 'Archivo ausente, formato no soportado o tamaño mayor a 10 MB.',
    }),
    UseFilters(AudioUploadExceptionFilter),
    UseInterceptors(FileInterceptor('file', audioUploadOptions)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary', description: 'Archivo de audio a subir.' } },
      },
    }),
  ),
  findOne: ApiRoute('get', ':id', {
    operationId: 'getNoteById',
    summary: 'Obtener una nota por id',
    returns: { status: 'ok', type: NoteResponseDto, description: 'Nota encontrada.' },
    notFound: true,
  }),
  update: ApiRoute('put', ':id', {
    operationId: 'updateNote',
    summary: 'Actualizar una nota existente',
    returns: { status: 'ok', type: NoteResponseDto, description: 'Nota actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  remove: ApiRoute('delete', ':id', {
    operationId: 'deleteNote',
    summary: 'Eliminar una nota',
    returns: { status: 'noContent', description: 'Nota eliminada correctamente. No retorna contenido.' },
    notFound: true,
  }),
};
