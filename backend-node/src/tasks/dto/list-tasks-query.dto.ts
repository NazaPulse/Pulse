import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskPriority, TaskStatus } from '../task.entity';

/**
 * Query params opcionales de `GET /api/tasks` (openapi.yaml).
 * Los filtros se combinan con AND lógico.
 */
export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be one of the following values: pending, completed',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: 'priority must be one of the following values: low, medium, high',
  })
  priority?: TaskPriority;
}
