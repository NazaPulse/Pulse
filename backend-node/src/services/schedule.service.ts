import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { CreateTimeBlockDto } from '../dto/schedule/create-time-block.dto';
import { ListScheduleQueryDto } from '../dto/schedule/list-schedule-query.dto';
import { TimeBlockResponseDto } from '../dto/schedule/time-block-response.dto';
import { UpdateTimeBlockDto } from '../dto/schedule/update-time-block.dto';
import { Task } from '../models/task.entity';
import { TimeBlock, TimeBlockCategory } from '../models/time-block.entity';
import { EMPTY_UPDATE_MESSAGE } from './tasks.service';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';
export const INVALID_RANGE_MESSAGE = 'start_time debe ser anterior a end_time.';

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

function assertValidRange(start: Date, end: Date): void {
  if (start.getTime() >= end.getTime()) {
    throw new BadRequestException(INVALID_RANGE_MESSAGE);
  }
}

/** Campos NOT NULL: un `null` explícito se ignora (igual que el Backend B). */
function applyRequiredFields(block: TimeBlock, dto: UpdateTimeBlockDto): void {
  if (isPresent(dto.title)) block.title = dto.title;
  if (isPresent(dto.start_time)) block.startTime = new Date(dto.start_time);
  if (isPresent(dto.end_time)) block.endTime = new Date(dto.end_time);
  if (isPresent(dto.actual_duration_minutes)) block.actualDurationMinutes = dto.actual_duration_minutes;
  if (isPresent(dto.category)) block.category = dto.category;
  if (isPresent(dto.is_completed)) block.isCompleted = dto.is_completed;
}

function applyNullableFields(block: TimeBlock, dto: UpdateTimeBlockDto): void {
  if (dto.description !== undefined) block.description = dto.description;
  if (dto.task_id !== undefined) block.taskId = dto.task_id;
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(TimeBlock)
    private readonly blocks: Repository<TimeBlock>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  /** Bloques del usuario que se superponen con `[from, to)`, por `start_time` ascendente. */
  async findAllForUser(userId: string, query: ListScheduleQueryDto = {}): Promise<TimeBlockResponseDto[]> {
    const where: FindOptionsWhere<TimeBlock> = { userId };
    if (query.from) where.endTime = MoreThan(new Date(query.from));
    if (query.to) where.startTime = LessThan(new Date(query.to));

    const rows = await this.blocks.find({ where, order: { startTime: 'ASC' } });
    return rows.map((row) => TimeBlockResponseDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateTimeBlockDto): Promise<TimeBlockResponseDto> {
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);
    assertValidRange(startTime, endTime);
    if (dto.task_id) await this.assertOwnedTask(userId, dto.task_id);

    const entity = this.blocks.create({
      userId,
      title: dto.title,
      description: dto.description ?? null,
      startTime,
      endTime,
      actualDurationMinutes: dto.actual_duration_minutes ?? 0,
      category: dto.category ?? TimeBlockCategory.OTHER,
      taskId: dto.task_id ?? null,
      isCompleted: dto.is_completed ?? false,
    });
    const saved = await this.blocks.save(entity);
    return TimeBlockResponseDto.fromEntity(saved);
  }

  /** Edición parcial: el rango se valida combinando lo enviado con lo guardado. */
  async update(userId: string, id: string, dto: UpdateTimeBlockDto): Promise<TimeBlockResponseDto> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException(EMPTY_UPDATE_MESSAGE);
    }

    const block = await this.findOwnedOrFail(userId, id);
    applyRequiredFields(block, dto);
    applyNullableFields(block, dto);
    assertValidRange(block.startTime, block.endTime);
    if (dto.task_id) await this.assertOwnedTask(userId, dto.task_id);

    const saved = await this.blocks.save(block);
    return TimeBlockResponseDto.fromEntity(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const block = await this.findOwnedOrFail(userId, id);
    await this.blocks.remove(block);
  }

  /** Una tarea de otro usuario (o inexistente) responde `404`, igual que un bloque ajeno. */
  private async assertOwnedTask(userId: string, taskId: string): Promise<void> {
    const exists = await this.tasks.exists({ where: { id: taskId, userId } });
    if (!exists) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
  }

  /**
   * Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
   * formato inválido) responde `404` — nunca revela si existe para otro.
   */
  private async findOwnedOrFail(userId: string, id: string): Promise<TimeBlock> {
    if (!isUUID(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const block = await this.blocks.findOne({ where: { id, userId } });
    if (!block) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return block;
  }
}
