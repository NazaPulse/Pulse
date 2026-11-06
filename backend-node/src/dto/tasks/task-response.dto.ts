import { ApiProperty } from '@nestjs/swagger';
import { Task, TaskPriority, TaskStatus } from '../../models/task.entity';
import { Field } from '../../common/decorators/field.decorator';

const isoOrNull = (date: Date | null) => (date ? date.toISOString() : null);

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9' })),
  title: Field(ApiProperty({ maxLength: 200, example: 'Pagar la tarjeta de crédito' })),
  description: Field(
    ApiProperty({ type: String, nullable: true, maxLength: 1000, example: 'Vence el resumen de septiembre' }),
  ),
  priority: Field(ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })),
  status: Field(ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })),
  due_date: Field(
    ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-10-10T23:59:00.000Z' }),
  ),
  estimated_minutes: Field(ApiProperty({ type: Number, nullable: true, minimum: 5, maximum: 1440, example: 90 })),
  user_id: Field(ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })),
};

/**
 * Respuesta de las rutas de Tareas. Espejo exacto de `Task` en openapi.yaml.
 */
export class TaskResponseDto {
  @fields.id
  id!: string;

  @fields.title
  title!: string;

  @fields.description
  description!: string | null;

  @fields.priority
  priority!: TaskPriority;

  @fields.status
  status!: TaskStatus;

  @fields.due_date
  due_date!: string | null;

  @fields.estimated_minutes
  estimated_minutes!: number | null;

  @fields.user_id
  user_id!: string;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
  updated_at!: string;

  static fromEntity(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.title = task.title;
    dto.description = task.description ?? null;
    dto.priority = task.priority;
    dto.status = task.status;
    dto.due_date = isoOrNull(task.dueDate);
    dto.estimated_minutes = task.estimatedMinutes ?? null;
    dto.user_id = task.userId;
    dto.created_at = task.createdAt.toISOString();
    dto.updated_at = task.updatedAt.toISOString();
    return dto;
  }
}
