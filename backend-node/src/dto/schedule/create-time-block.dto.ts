import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { TimeBlockCategory } from '../../models/time-block.entity';

export const CATEGORY_ENUM_MESSAGE =
  'category must be one of the following values: work, sleep, leisure, exercise, other';

/**
 * Cuerpo de `POST /api/schedule`.
 * Espejo exacto de `CreateTimeBlockDTO` en openapi.yaml. `user_id` se toma del
 * JWT; `start_time < end_time` se valida en el servicio.
 */
export class CreateTimeBlockDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 1000, example: 'Revisar el resumen antes de pagar' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T13:00:00.000Z' })
  @IsDateString({ strict: true })
  start_time!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T14:30:00.000Z' })
  @IsDateString({ strict: true })
  end_time!: string;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  actual_duration_minutes?: number;

  @ApiPropertyOptional({ enum: TimeBlockCategory, default: TimeBlockCategory.OTHER })
  @IsOptional()
  @IsEnum(TimeBlockCategory, { message: CATEGORY_ENUM_MESSAGE })
  category?: TimeBlockCategory;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  task_id?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}
