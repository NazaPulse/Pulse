import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { assertNotEmptyUpdate, findOwnedOrFail, pickDefined, pickPresent, toDate } from '../common/owned-records';
import { CreateTaskDto } from '../dto/tasks/create-task.dto';
import { ListTasksQueryDto } from '../dto/tasks/list-tasks-query.dto';
import { TaskResponseDto } from '../dto/tasks/task-response.dto';
import { UpdateTaskDto } from '../dto/tasks/update-task.dto';
import { Task, TaskPriority, TaskStatus } from '../models/task.entity';

export { EMPTY_UPDATE_MESSAGE } from '../common/owned-records';

const toResponse = (row: Task) => TaskResponseDto.fromEntity(row);

const newestFirst = { createdAt: 'DESC' } as const;

/** Valores de una tarea nueva para los campos que el cliente no envía. */
const TASK_DEFAULTS = {
  description: null,
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.PENDING,
  dueDate: null,
  estimatedMinutes: null,
};

/** Columnas de una tarea nueva: lo enviado por el cliente sobre {@link TASK_DEFAULTS}. */
function newTask(userId: string, dto: CreateTaskDto) {
  return {
    userId,
    ...TASK_DEFAULTS,
    ...pickPresent({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      dueDate: toDate(dto.due_date || undefined),
      estimatedMinutes: dto.estimated_minutes,
    }),
  };
}

/** Filtros opcionales del listado (siempre acotado al usuario). */
function taskFilters(userId: string, query: ListTasksQueryDto): FindOptionsWhere<Task> {
  return { userId, ...pickPresent({ status: query.status || undefined, priority: query.priority || undefined }) };
}

/**
 * Cambios de un PATCH. `title`/`priority`/`status` son NOT NULL: un `null` explícito se
 * ignora (`@IsOptional` lo deja pasar la validación), igual que el Backend B; en los campos
 * anulables, `null` borra el valor.
 */
function taskChanges(dto: UpdateTaskDto): Partial<Task> {
  return {
    ...pickPresent({ title: dto.title, priority: dto.priority, status: dto.status }),
    ...pickDefined({
      description: dto.description,
      dueDate: toDate(dto.due_date),
      estimatedMinutes: dto.estimated_minutes,
    }),
  };
}

/** Tareas del usuario (más recientes primero). `update` es una edición parcial. */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  async findAllForUser(userId: string, query: ListTasksQueryDto = {}) {
    const rows = await this.tasks.find({ where: taskFilters(userId, query), order: newestFirst });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const entity = this.tasks.create(newTask(userId, dto));
    return toResponse(await this.tasks.save(entity));
  }

  async findOneForUser(userId: string, id: string) {
    return toResponse(await findOwnedOrFail(this.tasks, userId, id));
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    assertNotEmptyUpdate(dto);
    const task = await findOwnedOrFail(this.tasks, userId, id);
    Object.assign(task, taskChanges(dto));
    return toResponse(await this.tasks.save(task));
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await findOwnedOrFail(this.tasks, userId, id);
    await this.tasks.remove(task);
  }
}
