import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';
import { TaskPriority, TaskStatus } from '../../models/task.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  title: Field(
    ApiPropertyOptional({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' }),
    IsOptional(),
    IsString(),
    MinLength(1),
    MaxLength(200),
  ),
  description: Field(
    ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 }),
    ValidateIf((_o, value) => value !== null && value !== undefined),
    IsString(),
    MaxLength(1000),
  ),
  priority: Field(
    ApiPropertyOptional({ enum: TaskPriority }),
    IsOptional(),
    IsEnum(TaskPriority, {
      message: 'priority must be one of the following values: low, medium, high',
    }),
  ),
  status: Field(
    ApiPropertyOptional({ enum: TaskStatus }),
    IsOptional(),
    IsEnum(TaskStatus, {
      message: 'status must be one of the following values: pending, completed',
    }),
  ),
  due_date: Field(
    ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }),
    ValidateIf((_o, value) => value !== null && value !== undefined),
    IsDateString({ strict: true }),
    IsNotPastDate(),
  ),
  estimated_minutes: Field(
    ApiPropertyOptional({ type: Number, nullable: true, minimum: 5, maximum: 1440 }),
    ValidateIf((_o, value) => value !== null && value !== undefined),
    IsInt(),
    Min(5),
    Max(1440),
  ),
};

/**
 * Cuerpo de `PATCH /api/tasks/{id}`.
 * Espejo exacto de `UpdateTaskDTO` en openapi.yaml: edición parcial, debe
 * enviarse al menos un campo (validado en el servicio). `description` y
 * `due_date` aceptan `null` para eliminarlos.
 */
export class UpdateTaskDto {
  @fields.title
  title?: string;

  @fields.description
  description?: string | null;

  @fields.priority
  priority?: TaskPriority;

  @fields.status
  status?: TaskStatus;

  @fields.due_date
  due_date?: string | null;

  @fields.estimated_minutes
  estimated_minutes?: number | null;
}
