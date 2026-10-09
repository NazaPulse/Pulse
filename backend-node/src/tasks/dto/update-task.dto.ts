import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';
import { TaskPriority, TaskStatus } from '../task.entity';

/**
 * Cuerpo de `PATCH /api/tasks/{id}`.
 * Espejo exacto de `UpdateTaskDTO` en openapi.yaml: edición parcial, debe
 * enviarse al menos un campo (validado en el servicio). `description` y
 * `due_date` aceptan `null` para eliminarlos.
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @ValidateIf((_o, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: 'priority must be one of the following values: low, medium, high',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be one of the following values: pending, completed',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @ValidateIf((_o, value) => value !== null && value !== undefined)
  @IsDateString({ strict: true })
  @IsNotPastDate()
  due_date?: string | null;
}
