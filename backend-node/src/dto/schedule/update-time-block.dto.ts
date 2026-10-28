import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TimeBlockCategory } from '../../models/time-block.entity';
import { CATEGORY_ENUM_MESSAGE } from './create-time-block.dto';

/**
 * Cuerpo de `PATCH /api/schedule/{id}`.
 * Espejo exacto de `UpdateTimeBlockDTO` en openapi.yaml: edición parcial, debe
 * enviarse al menos un campo (validado en el servicio). `description` y
 * `task_id` aceptan `null` para eliminarlos.
 */
export class UpdateTimeBlockDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 200 })
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

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  start_time?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  end_time?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  actual_duration_minutes?: number;

  @ApiPropertyOptional({ enum: TimeBlockCategory })
  @IsOptional()
  @IsEnum(TimeBlockCategory, { message: CATEGORY_ENUM_MESSAGE })
  category?: TimeBlockCategory;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  @ValidateIf((_o, value) => value !== null && value !== undefined)
  @IsUUID()
  task_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}
