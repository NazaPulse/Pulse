import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../models/task.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  status: Field(
    ApiPropertyOptional({ enum: TaskStatus }),
    IsOptional(),
    IsEnum(TaskStatus, {
      message: 'status must be one of the following values: pending, completed',
    }),
  ),
  priority: Field(
    ApiPropertyOptional({ enum: TaskPriority }),
    IsOptional(),
    IsEnum(TaskPriority, {
      message: 'priority must be one of the following values: low, medium, high',
    }),
  ),
};

/**
 * Query params opcionales de `GET /api/tasks` (openapi.yaml).
 * Los filtros se combinan con AND lógico.
 */
export class ListTasksQueryDto {
  @fields.status
  status?: TaskStatus;

  @fields.priority
  priority?: TaskPriority;
}
