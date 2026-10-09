import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

/**
 * Rutas de Tareas (Issue #18). Reproduce `/api/tasks` y `/api/tasks/{id}` de
 * openapi.yaml. Todas las rutas requieren JWT y filtran por el usuario
 * autenticado.
 */
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ operationId: 'listTasks', summary: 'Listar las tareas del usuario autenticado' })
  @ApiOkResponse({ type: TaskResponseDto, isArray: true, description: 'Listado de tareas del usuario autenticado.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de los filtros.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.tasks.findAllForUser(user.id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createTask', summary: 'Crear una nueva tarea' })
  @ApiCreatedResponse({ type: TaskResponseDto, description: 'Tarea creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getTaskById', summary: 'Obtener una tarea por id' })
  @ApiOkResponse({ type: TaskResponseDto, description: 'Tarea encontrada.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TaskResponseDto> {
    return this.tasks.findOneForUser(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateTask', summary: 'Actualizar parcialmente una tarea existente' })
  @ApiOkResponse({ type: TaskResponseDto, description: 'Tarea actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteTask', summary: 'Eliminar una tarea' })
  @ApiNoContentResponse({ description: 'Tarea eliminada correctamente. No retorna contenido.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.tasks.remove(user.id, id);
  }
}
