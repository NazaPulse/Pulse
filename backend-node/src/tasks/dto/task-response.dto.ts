import { ApiProperty } from '@nestjs/swagger';
import { Task, TaskPriority, TaskStatus } from '../task.entity';

/**
 * Respuesta de las rutas de Tareas. Espejo exacto de `Task` en openapi.yaml.
 */
export class TaskResponseDto {
  @ApiProperty({ format: 'uuid', example: '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9' })
  id!: string;

  @ApiProperty({ maxLength: 200, example: 'Pagar la tarjeta de crédito' })
  title!: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 1000, example: 'Vence el resumen de septiembre' })
  description!: string | null;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status!: TaskStatus;

  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-10-10T23:59:00.000Z' })
  due_date!: string | null;

  @ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })
  user_id!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })
  updated_at!: string;

  static fromEntity(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.title = task.title;
    dto.description = task.description ?? null;
    dto.priority = task.priority;
    dto.status = task.status;
    dto.due_date = task.dueDate ? task.dueDate.toISOString() : null;
    dto.user_id = task.userId;
    dto.created_at = task.createdAt.toISOString();
    dto.updated_at = task.updatedAt.toISOString();
    return dto;
  }
}
