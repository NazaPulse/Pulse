import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min, IsString, MaxLength, MinLength } from 'class-validator';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';
import { TaskPriority, TaskStatus } from '../../models/task.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  title: Field(
    ApiProperty({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' }),
    IsString(),
    MinLength(1),
    MaxLength(200),
  ),
  description: Field(
    ApiPropertyOptional({ maxLength: 1000, example: 'Vence el resumen de septiembre' }),
    IsOptional(),
    IsString(),
    MaxLength(1000),
  ),
  priority: Field(
    ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM }),
    IsOptional(),
    IsEnum(TaskPriority, {
      message: 'priority must be one of the following values: low, medium, high',
    }),
  ),
  status: Field(
    ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING }),
    IsOptional(),
    IsEnum(TaskStatus, {
      message: 'status must be one of the following values: pending, completed',
    }),
  ),
  due_date: Field(
    ApiPropertyOptional({ format: 'date-time', example: '2026-10-10T23:59:00.000Z' }),
    IsOptional(),
    IsDateString({ strict: true }),
    IsNotPastDate(),
  ),
  estimated_minutes: Field(
    ApiPropertyOptional({ type: Number, minimum: 5, maximum: 1440, example: 90 }),
    IsOptional(),
    IsInt(),
    Min(5),
    Max(1440),
  ),
};

/**
 * Cuerpo de `POST /api/tasks`.
 * Espejo exacto de `CreateTaskDTO` en openapi.yaml. `user_id` se toma del JWT.
 */
export class CreateTaskDto {
  @fields.title
  title!: string;

  @fields.description
  description?: string;

  @fields.priority
  priority?: TaskPriority;

  @fields.status
  status?: TaskStatus;

  @fields.due_date
  due_date?: string;

  @fields.estimated_minutes
  estimated_minutes?: number;
}
