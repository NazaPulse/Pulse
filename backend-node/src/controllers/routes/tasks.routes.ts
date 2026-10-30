import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { TaskResponseDto } from '../../dto/tasks/task-response.dto';

/**
 * Rutas de Tareas (Issue #18). Reproduce `/api/tasks` y `/api/tasks/{id}` de
 * openapi.yaml. Todas las rutas requieren JWT y filtran por el usuario
 * autenticado.
 */
export const TasksRoutes = {
  controller: ApiResource('Tasks', 'api/tasks'),
  list: ApiRoute('get', undefined, {
    operationId: 'listTasks',
    summary: 'Listar las tareas del usuario autenticado',
    returns: {
      status: 'ok',
      type: TaskResponseDto,
      isArray: true,
      description: 'Listado de tareas del usuario autenticado.',
    },
    badRequest: 'Fallo de validación de los filtros.',
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createTask',
    summary: 'Crear una nueva tarea',
    returns: { status: 'created', type: TaskResponseDto, description: 'Tarea creada correctamente.' },
    badRequest: true,
  }),
  findOne: ApiRoute('get', ':id', {
    operationId: 'getTaskById',
    summary: 'Obtener una tarea por id',
    returns: { status: 'ok', type: TaskResponseDto, description: 'Tarea encontrada.' },
    notFound: true,
  }),
  update: ApiRoute('patch', ':id', {
    operationId: 'updateTask',
    summary: 'Actualizar parcialmente una tarea existente',
    returns: { status: 'ok', type: TaskResponseDto, description: 'Tarea actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  /**
   * Alias de `PATCH` (misma semántica de edición parcial) para clientes que no
   * usen PATCH. No figura en openapi.yaml, por eso se excluye de Swagger.
   */
  replace: ApiRoute('put', ':id', 'hidden'),
  remove: ApiRoute('delete', ':id', {
    operationId: 'deleteTask',
    summary: 'Eliminar una tarea',
    returns: { status: 'noContent', description: 'Tarea eliminada correctamente. No retorna contenido.' },
    notFound: true,
  }),
};
