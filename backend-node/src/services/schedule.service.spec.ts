import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { CreateTimeBlockDto } from '../dto/schedule/create-time-block.dto';
import { Task } from '../models/task.entity';
import { TimeBlock, TimeBlockCategory } from '../models/time-block.entity';
import { INVALID_RANGE_MESSAGE, ScheduleService } from './schedule.service';

/**
 * Issue #23 — Cronograma diario:
 *  - list filtra siempre por userId (+ rango opcional) y ordena por start_time.
 *  - create aplica defaults (other / 0 / false) y valida start_time < end_time (400).
 *  - PATCH valida el rango combinando lo enviado con lo guardado.
 *  - Bloque o tarea de otro usuario / inexistente / id inválido -> 404.
 */
describe('ScheduleService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const BLOCK_ID = '7c6b5a49-3827-4165-9d4c-3b2a19087f6e';
  const TASK_ID = '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9';

  const buildBlock = (over: Partial<TimeBlock> = {}): TimeBlock =>
    Object.assign(new TimeBlock(), {
      id: BLOCK_ID,
      userId: OWNER_ID,
      title: 'Foco profundo',
      description: null,
      startTime: new Date('2026-10-28T13:00:00.000Z'),
      endTime: new Date('2026-10-28T14:30:00.000Z'),
      actualDurationMinutes: 25,
      category: TimeBlockCategory.WORK,
      taskId: null,
      isCompleted: false,
      createdAt: new Date('2026-10-28T12:00:00.000Z'),
      updatedAt: new Date('2026-10-28T12:00:00.000Z'),
      ...over,
    });

  let blocks: jest.Mocked<Pick<Repository<TimeBlock>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
  let tasks: jest.Mocked<Pick<Repository<Task>, 'exists'>>;
  let service: ScheduleService;

  beforeEach(() => {
    blocks = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v) => Object.assign(new TimeBlock(), v)) as never,
      save: jest.fn(async (v) => Object.assign(buildBlock(), v)) as never,
      remove: jest.fn(),
    };
    tasks = { exists: jest.fn().mockResolvedValue(true) };
    service = new ScheduleService(
      blocks as unknown as Repository<TimeBlock>,
      tasks as unknown as Repository<Task>,
    );
  });

  it('findAllForUser filtra por userId + rango y mapea al contrato', async () => {
    blocks.find.mockResolvedValue([buildBlock()]);

    const result = await service.findAllForUser(OWNER_ID, {
      from: '2026-10-28T03:00:00.000Z',
      to: '2026-10-29T03:00:00.000Z',
    });

    expect(blocks.find).toHaveBeenCalledWith({
      where: {
        userId: OWNER_ID,
        endTime: MoreThan(new Date('2026-10-28T03:00:00.000Z')),
        startTime: LessThan(new Date('2026-10-29T03:00:00.000Z')),
      },
      order: { startTime: 'ASC' },
    });
    expect(result).toEqual([
      {
        id: BLOCK_ID,
        title: 'Foco profundo',
        description: null,
        start_time: '2026-10-28T13:00:00.000Z',
        end_time: '2026-10-28T14:30:00.000Z',
        actual_duration_minutes: 25,
        category: 'work',
        task_id: null,
        is_completed: false,
        user_id: OWNER_ID,
      },
    ]);
  });

  it('create aplica defaults y el user_id del JWT', async () => {
    await service.create(OWNER_ID, {
      title: 'Bloque',
      start_time: '2026-10-28T13:00:00.000Z',
      end_time: '2026-10-28T14:00:00.000Z',
    });

    expect(blocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: OWNER_ID,
        description: null,
        actualDurationMinutes: 0,
        category: TimeBlockCategory.OTHER,
        taskId: null,
        isCompleted: false,
      }),
    );
  });

  it.each([
    ['igual', '2026-10-28T13:00:00.000Z'],
    ['anterior', '2026-10-28T12:00:00.000Z'],
  ])('create rechaza end_time %s a start_time con 400', async (_label, end) => {
    await expect(
      service.create(OWNER_ID, { title: 'B', start_time: '2026-10-28T13:00:00.000Z', end_time: end }),
    ).rejects.toThrow(new BadRequestException(INVALID_RANGE_MESSAGE));
    expect(blocks.save).not.toHaveBeenCalled();
  });

  it('create con task_id ajeno responde 404', async () => {
    tasks.exists.mockResolvedValue(false);
    await expect(
      service.create(OWNER_ID, {
        title: 'B',
        start_time: '2026-10-28T13:00:00.000Z',
        end_time: '2026-10-28T14:00:00.000Z',
        task_id: TASK_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tasks.exists).toHaveBeenCalledWith({ where: { id: TASK_ID, userId: OWNER_ID } });
  });

  it('update valida el rango combinando lo enviado con lo guardado', async () => {
    blocks.findOne.mockResolvedValue(buildBlock());
    await expect(
      service.update(OWNER_ID, BLOCK_ID, { start_time: '2026-10-28T15:00:00.000Z' }),
    ).rejects.toThrow(new BadRequestException(INVALID_RANGE_MESSAGE));
  });

  it('update parcial: redimensiona y borra task_id con null', async () => {
    blocks.findOne.mockResolvedValue(buildBlock({ taskId: TASK_ID }));
    const result = await service.update(OWNER_ID, BLOCK_ID, {
      end_time: '2026-10-28T16:00:00.000Z',
      task_id: null,
    });
    expect(result.end_time).toBe('2026-10-28T16:00:00.000Z');
    expect(result.start_time).toBe('2026-10-28T13:00:00.000Z');
    expect(result.task_id).toBeNull();
  });

  it('update con payload vacío responde 400', async () => {
    await expect(service.update(OWNER_ID, BLOCK_ID, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bloque de otro usuario o id inválido responde 404', async () => {
    blocks.findOne.mockResolvedValue(null);
    await expect(service.remove(OWNER_ID, BLOCK_ID)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(OWNER_ID, 'no-es-uuid')).rejects.toBeInstanceOf(NotFoundException);
    expect(blocks.findOne).toHaveBeenCalledWith({ where: { id: BLOCK_ID, userId: OWNER_ID } });
  });

  it('CreateTimeBlockDto rechaza categoría inválida y minutos negativos', async () => {
    const dto = plainToInstance(CreateTimeBlockDto, {
      title: 'B',
      start_time: '2026-10-28T13:00:00.000Z',
      end_time: '2026-10-28T14:00:00.000Z',
      category: 'nap',
      actual_duration_minutes: -5,
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property).sort()).toEqual(['actual_duration_minutes', 'category']);
  });
});
