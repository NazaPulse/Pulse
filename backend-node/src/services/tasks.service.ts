import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateTaskDto } from '../dto/tasks/create-task.dto';
import { ListTasksQueryDto } from '../dto/tasks/list-tasks-query.dto';
import { TaskResponseDto } from '../dto/tasks/task-response.dto';
import { UpdateTaskDto } from '../dto/tasks/update-task.dto';
import { Task, TaskPriority, TaskStatus } from '../models/task.entity';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';
export const EMPTY_UPDATE_MESSAGE = 'Debe enviarse al menos un campo para actualizar.';

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

/**
 * `title`/`priority`/`status` son NOT NULL: un `null` explícito se ignora
 * (`@IsOptional` lo deja pasar la validación). Igual que el Backend B.
 */
function applyRequiredFields(task: Task, dto: UpdateTaskDto): void {
  if (isPresent(dto.title)) task.title = dto.title;
  if (isPresent(dto.priority)) task.priority = dto.priority;
  if (isPresent(dto.status)) task.status = dto.status;
}

function applyNullableFields(task: Task, dto: UpdateTaskDto): void {
  if (dto.description !== undefined) task.description = dto.description;
  if (dto.due_date !== undefined) {
    task.dueDate = dto.due_date === null ? null : new Date(dto.due_date);
  }
  if (dto.estimated_minutes !== undefined) task.estimatedMinutes = dto.estimated_minutes;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  async findAllForUser(userId: string, query: ListTasksQueryDto = {}): Promise<TaskResponseDto[]> {
    const where: FindOptionsWhere<Task> = { userId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    const rows = await this.tasks.find({ where, order: { createdAt: 'DESC' } });
    return rows.map((row) => TaskResponseDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const entity = this.tasks.create({
      userId,
      title: dto.title,
      description: dto.description ?? null,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      status: dto.status ?? TaskStatus.PENDING,
      dueDate: dto.due_date ? new Date(dto.due_date) : null,
      estimatedMinutes: dto.estimated_minutes ?? null,
    });
    const saved = await this.tasks.save(entity);
    return TaskResponseDto.fromEntity(saved);
  }

  async findOneForUser(userId: string, id: string): Promise<TaskResponseDto> {
    const task = await this.findOwnedOrFail(userId, id);
    return TaskResponseDto.fromEntity(task);
  }

  /** Edición parcial: solo se modifican los campos presentes en el payload. */
  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException(EMPTY_UPDATE_MESSAGE);
    }

    const task = await this.findOwnedOrFail(userId, id);
    applyRequiredFields(task, dto);
    applyNullableFields(task, dto);
    const saved = await this.tasks.save(task);
    return TaskResponseDto.fromEntity(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.findOwnedOrFail(userId, id);
    await this.tasks.remove(task);
  }

  /**
   * Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
   * formato inválido) responde `404` — nunca revela si existe para otro.
   */
  private async findOwnedOrFail(userId: string, id: string): Promise<Task> {
    if (!isUUID(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const task = await this.tasks.findOne({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return task;
  }
}
