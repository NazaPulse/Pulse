import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import {
  assertNotEmptyUpdate,
  assertOwned,
  findOwnedOrFail,
  pickDefined,
  pickPresent,
  toDate,
} from '../common/owned-records';
import { CreateTimeBlockDto } from '../dto/schedule/create-time-block.dto';
import { ListScheduleQueryDto } from '../dto/schedule/list-schedule-query.dto';
import { TimeBlockResponseDto } from '../dto/schedule/time-block-response.dto';
import { UpdateTimeBlockDto } from '../dto/schedule/update-time-block.dto';
import { Task } from '../models/task.entity';
import { TimeBlock, TimeBlockCategory } from '../models/time-block.entity';

export const INVALID_RANGE_MESSAGE = 'start_time debe ser anterior a end_time.';

const toResponse = (row: TimeBlock) => TimeBlockResponseDto.fromEntity(row);

/** Valores de un bloque nuevo para los campos que el cliente no envía. */
const BLOCK_DEFAULTS = {
  description: null,
  actualDurationMinutes: 0,
  category: TimeBlockCategory.OTHER,
  taskId: null,
  isCompleted: false,
};

/** Columnas de un bloque nuevo: lo enviado por el cliente sobre {@link BLOCK_DEFAULTS}. */
function newBlock(userId: string, dto: CreateTimeBlockDto, range: { startTime: Date; endTime: Date }) {
  return {
    userId,
    ...BLOCK_DEFAULTS,
    ...pickPresent({
      title: dto.title,
      description: dto.description,
      actualDurationMinutes: dto.actual_duration_minutes,
      category: dto.category,
      taskId: dto.task_id,
      isCompleted: dto.is_completed,
    }),
    ...range,
  };
}

const byStartTime = { startTime: 'ASC' } as const;

function assertValidRange(start: Date, end: Date): void {
  if (start.getTime() >= end.getTime()) {
    throw new BadRequestException(INVALID_RANGE_MESSAGE);
  }
}

/** Bloques del usuario que se superponen con `[from, to)`. */
function overlapFilters(userId: string, query: ListScheduleQueryDto): FindOptionsWhere<TimeBlock> {
  const where: FindOptionsWhere<TimeBlock> = { userId };
  if (query.from) where.endTime = MoreThan(new Date(query.from));
  if (query.to) where.startTime = LessThan(new Date(query.to));
  return where;
}

/** Cambios de un PATCH: los campos NOT NULL ignoran un `null` explícito (igual que el Backend B). */
function blockChanges(dto: UpdateTimeBlockDto): Partial<TimeBlock> {
  return {
    ...pickPresent({
      title: dto.title,
      startTime: toDate(dto.start_time),
      endTime: toDate(dto.end_time),
      actualDurationMinutes: dto.actual_duration_minutes,
      category: dto.category,
      isCompleted: dto.is_completed,
    }),
    ...pickDefined({ description: dto.description, taskId: dto.task_id }),
  };
}

/**
 * Cronograma del usuario, por `start_time` ascendente. `start_time < end_time` (si no, `400`);
 * en un PATCH el rango se valida combinando lo enviado con lo guardado. Una tarea vinculada de
 * otro usuario (o inexistente) responde `404`, igual que un bloque ajeno.
 */
@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(TimeBlock)
    private readonly blocks: Repository<TimeBlock>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  async findAllForUser(userId: string, query: ListScheduleQueryDto = {}) {
    const rows = await this.blocks.find({ where: overlapFilters(userId, query), order: byStartTime });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateTimeBlockDto) {
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);
    assertValidRange(startTime, endTime);
    if (dto.task_id) await assertOwned(this.tasks, userId, dto.task_id);

    const entity = this.blocks.create(newBlock(userId, dto, { startTime, endTime }));
    return toResponse(await this.blocks.save(entity));
  }

  async update(userId: string, id: string, dto: UpdateTimeBlockDto) {
    assertNotEmptyUpdate(dto);
    const block = await findOwnedOrFail(this.blocks, userId, id);
    Object.assign(block, blockChanges(dto));
    assertValidRange(block.startTime, block.endTime);
    if (dto.task_id) await assertOwned(this.tasks, userId, dto.task_id);
    return toResponse(await this.blocks.save(block));
  }

  async remove(userId: string, id: string): Promise<void> {
    const block = await findOwnedOrFail(this.blocks, userId, id);
    await this.blocks.remove(block);
  }
}
