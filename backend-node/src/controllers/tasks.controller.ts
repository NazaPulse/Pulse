import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { CreateTaskDto } from '../dto/tasks/create-task.dto';
import { ListTasksQueryDto } from '../dto/tasks/list-tasks-query.dto';
import { TaskResponseDto } from '../dto/tasks/task-response.dto';
import { UpdateTaskDto } from '../dto/tasks/update-task.dto';
import { TasksService } from '../services/tasks.service';

/**
 * Rutas de Tareas (Issue #18). Reproduce `/api/tasks` y `/api/tasks/{id}` de
 * openapi.yaml. Todas las rutas requieren JWT y filtran por el usuario
 * autenticado.
 */
@ApiProtected('Tasks')
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listTasks',
    summary: 'Listar las tareas del usuario autenticado',
    returns: {
      status: 'ok',
      type: TaskResponseDto,
      isArray: true,
      description: 'Listado de tareas del usuario autenticado.',
    },
    badRequest: 'Fallo de validación de los filtros.',
  })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListTasksQueryDto): Promise<TaskResponseDto[]> {
    return this.tasks.findAllForUser(user.id, query);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createTask',
    summary: 'Crear una nueva tarea',
    returns: { status: 'created', type: TaskResponseDto, description: 'Tarea creada correctamente.' },
    badRequest: true,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.tasks.create(user.id, dto);
  }

  @Get(':id')
  @ApiEndpoint({
    operationId: 'getTaskById',
    summary: 'Obtener una tarea por id',
    returns: { status: 'ok', type: TaskResponseDto, description: 'Tarea encontrada.' },
    notFound: true,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TaskResponseDto> {
    return this.tasks.findOneForUser(user.id, id);
  }

  @Patch(':id')
  @ApiEndpoint({
    operationId: 'updateTask',
    summary: 'Actualizar parcialmente una tarea existente',
    returns: { status: 'ok', type: TaskResponseDto, description: 'Tarea actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.update(user.id, id, dto);
  }

  /**
   * Alias de `PATCH` (misma semántica de edición parcial) para clientes que no
   * usen PATCH. No figura en openapi.yaml, por eso se excluye de Swagger.
   */
  @Put(':id')
  @ApiExcludeEndpoint()
  replace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiEndpoint({
    operationId: 'deleteTask',
    summary: 'Eliminar una tarea',
    returns: { status: 'noContent', description: 'Tarea eliminada correctamente. No retorna contenido.' },
    notFound: true,
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.tasks.remove(user.id, id);
  }
}
