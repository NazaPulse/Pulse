import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';
import { TaskPriority, TaskStatus } from '../task.entity';

/**
 * Cuerpo de `POST /api/tasks`.
 * Espejo exacto de `CreateTaskDTO` en openapi.yaml. `user_id` se toma del JWT.
 */
export class CreateTaskDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 1000, example: 'Vence el resumen de septiembre' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: 'priority must be one of the following values: low, medium, high',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be one of the following values: pending, completed',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({ format: 'date-time', example: '2026-10-10T23:59:00.000Z' })
  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotPastDate()
  due_date?: string;
}
