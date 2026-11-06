import { Body, Param, Query } from '@nestjs/common';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from '../dto/tasks/create-task.dto';
import { ListTasksQueryDto } from '../dto/tasks/list-tasks-query.dto';
import { UpdateTaskDto } from '../dto/tasks/update-task.dto';
import { TasksService } from '../services/tasks.service';
import { TasksRoutes } from './routes/tasks.routes';

/** Colección de tareas del usuario autenticado: listado y alta (ver {@link TasksRoutes}). */
@TasksRoutes.controller
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @TasksRoutes.list
  list(@UserId() userId: string, @Query() query: ListTasksQueryDto) {
    return this.tasks.findAllForUser(userId, query);
  }

  @TasksRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(userId, dto);
  }
}

/** Una tarea del usuario autenticado por `id`: consulta, edición y baja (ver {@link TasksRoutes}). */
@TasksRoutes.controller
export class TaskController {
  constructor(private readonly tasks: TasksService) {}

  @TasksRoutes.findOne
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.tasks.findOneForUser(userId, id);
  }

  @TasksRoutes.update
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(userId, id, dto);
  }

  @TasksRoutes.replace
  replace(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(userId, id, dto);
  }

  @TasksRoutes.remove
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.tasks.remove(userId, id);
  }
}
