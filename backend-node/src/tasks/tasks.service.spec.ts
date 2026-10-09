import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';

/**
 * Issue #18 — Tareas:
 *  - list filtra siempre por userId y combina status/priority con AND.
 *  - create aplica defaults (medium / pending) y user_id del JWT.
 *  - PATCH parcial: solo campos enviados; `null` borra description/due_date;
 *    payload vacío -> 400.
 *  - Recurso de otro usuario / inexistente / id inválido -> 404.
 *  - due_date pasada -> error de validación.
 */
describe('TasksService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const OTHER_USER_ID = '9a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9';
  const TASK_ID = '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9';

  const buildTask = (over: Partial<Task> = {}): Task =>
    Object.assign(new Task(), {
      id: TASK_ID,
      userId: OWNER_ID,
      title: 'Pagar la tarjeta',
      description: 'Vence el resumen',
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      dueDate: new Date('2030-10-10T23:59:00.000Z'),
      createdAt: new Date('2026-10-07T12:00:00.000Z'),
      updatedAt: new Date('2026-10-07T12:00:00.000Z'),
      ...over,
    });

  let repo: jest.Mocked<Pick<Repository<Task>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
  let service: TasksService;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v) => Object.assign(new Task(), v)) as never,
      save: jest.fn(async (v) => Object.assign(buildTask(), v)) as never,
      remove: jest.fn(),
    };
    service = new TasksService(repo as unknown as Repository<Task>);
  });

  it('findAllForUser filtra por userId + status + priority y mapea al contrato', async () => {
    repo.find.mockResolvedValue([buildTask()]);

    const result = await service.findAllForUser(OWNER_ID, {
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
    });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: OWNER_ID, status: TaskStatus.PENDING, priority: TaskPriority.HIGH },
      }),
    );
    expect(result[0]).toEqual({
      id: TASK_ID,
      title: 'Pagar la tarjeta',
      description: 'Vence el resumen',
      priority: 'high',
      status: 'pending',
      due_date: '2030-10-10T23:59:00.000Z',
      user_id: OWNER_ID,
      created_at: '2026-10-07T12:00:00.000Z',
      updated_at: '2026-10-07T12:00:00.000Z',
    });
  });

  it('create aplica defaults medium/pending y nulls', async () => {
    await service.create(OWNER_ID, { title: 'Sin detalles' });

    expect(repo.create).toHaveBeenCalledWith({
      userId: OWNER_ID,
      title: 'Sin detalles',
      description: null,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: null,
    });
  });

  it('update parcial: solo cambia los campos enviados y null borra due_date', async () => {
    repo.findOne.mockResolvedValue(buildTask());

    await service.update(OWNER_ID, TASK_ID, { status: TaskStatus.COMPLETED, due_date: null });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TaskStatus.COMPLETED,
        dueDate: null,
        title: 'Pagar la tarjeta',
        priority: TaskPriority.HIGH,
      }),
    );
  });

  it('update ignora null en title/priority/status (columnas NOT NULL)', async () => {
    repo.findOne.mockResolvedValue(buildTask());

    await service.update(OWNER_ID, TASK_ID, {
      title: null,
      priority: null,
      status: null,
      description: null,
    } as unknown as UpdateTaskDto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pagar la tarjeta',
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        description: null,
      }),
    );
  });

  it('update con payload vacío -> 400', async () => {
    await expect(service.update(OWNER_ID, TASK_ID, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  describe('aislamiento por usuario', () => {
    it('findOneForUser -> 404 si la tarea es de otro usuario', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser(OTHER_USER_ID, TASK_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: TASK_ID, userId: OTHER_USER_ID } });
    });

    it('id no UUID -> 404 sin tocar la DB', async () => {
      await expect(service.findOneForUser(OWNER_ID, 'no-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('remove de otro usuario -> 404 y no elimina', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(OTHER_USER_ID, TASK_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('validación de DTOs', () => {
    it('rechaza due_date en el pasado y priority inválida', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        title: 'x',
        priority: 'urgent',
        due_date: '2020-01-01T00:00:00.000Z',
      });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property).sort()).toEqual(['due_date', 'priority']);
    });

    it('rechaza due_date con formato inválido', async () => {
      const errors = await validate(plainToInstance(CreateTaskDto, { title: 'x', due_date: 'mañana' }));
      expect(errors.map((e) => e.property)).toEqual(['due_date']);
    });

    it('acepta due_date futura y null en PATCH', async () => {
      const future = new Date(Date.now() + 86_400_000).toISOString();
      expect(await validate(plainToInstance(CreateTaskDto, { title: 'x', due_date: future }))).toHaveLength(0);
      expect(
        await validate(plainToInstance(UpdateTaskDto, { due_date: null, description: null })),
      ).toHaveLength(0);
    });
  });
});
