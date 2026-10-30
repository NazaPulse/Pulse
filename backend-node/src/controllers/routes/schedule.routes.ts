import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { TimeBlockResponseDto } from '../../dto/schedule/time-block-response.dto';

/**
 * Rutas del Cronograma diario (Issue #23). Reproduce `/api/schedule` y
 * `/api/schedule/{id}` de openapi.yaml. Todas las rutas requieren JWT y
 * filtran por el usuario autenticado.
 */
export const ScheduleRoutes = {
  controller: ApiResource('Schedule', 'api/schedule'),
  list: ApiRoute('get', undefined, {
    operationId: 'listTimeBlocks',
    summary: 'Listar los bloques de tiempo del usuario autenticado',
    returns: {
      status: 'ok',
      type: TimeBlockResponseDto,
      isArray: true,
      description: 'Listado de bloques de tiempo del usuario autenticado.',
    },
    badRequest: 'Fallo de validación de los filtros.',
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createTimeBlock',
    summary: 'Agendar un nuevo bloque de tiempo',
    returns: { status: 'created', type: TimeBlockResponseDto, description: 'Bloque de tiempo creado correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  update: ApiRoute('patch', ':id', {
    operationId: 'updateTimeBlock',
    summary: 'Actualizar parcialmente un bloque de tiempo',
    returns: { status: 'ok', type: TimeBlockResponseDto, description: 'Bloque de tiempo actualizado correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  remove: ApiRoute('delete', ':id', {
    operationId: 'deleteTimeBlock',
    summary: 'Eliminar un bloque de tiempo',
    returns: { status: 'noContent', description: 'Bloque eliminado correctamente. No retorna contenido.' },
    notFound: true,
  }),
};
