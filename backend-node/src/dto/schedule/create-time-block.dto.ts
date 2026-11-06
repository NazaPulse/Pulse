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
import { Field } from '../../common/decorators/field.decorator';

export const CATEGORY_ENUM_MESSAGE =
  'category must be one of the following values: work, sleep, leisure, exercise, other';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  title: Field(
    ApiProperty({ minLength: 1, maxLength: 200, example: 'Pagar la tarjeta de crédito' }),
    IsString(),
    MinLength(1),
    MaxLength(200),
  ),
  description: Field(
    ApiPropertyOptional({ maxLength: 1000, example: 'Revisar el resumen antes de pagar' }),
    IsOptional(),
    IsString(),
    MaxLength(1000),
  ),
  start_time: Field(
    ApiProperty({ format: 'date-time', example: '2026-10-28T13:00:00.000Z' }),
    IsDateString({ strict: true }),
  ),
  end_time: Field(
    ApiProperty({ format: 'date-time', example: '2026-10-28T14:30:00.000Z' }),
    IsDateString({ strict: true }),
  ),
  actual_duration_minutes: Field(
    ApiPropertyOptional({ type: Number, minimum: 0, default: 0 }),
    IsOptional(),
    IsInt(),
    Min(0),
  ),
  category: Field(
    ApiPropertyOptional({ enum: TimeBlockCategory, default: TimeBlockCategory.OTHER }),
    IsOptional(),
    IsEnum(TimeBlockCategory, { message: CATEGORY_ENUM_MESSAGE }),
  ),
  task_id: Field(ApiPropertyOptional({ format: 'uuid' }), IsOptional(), IsUUID()),
  is_completed: Field(ApiPropertyOptional({ default: false }), IsOptional(), IsBoolean()),
};

/**
 * Cuerpo de `POST /api/schedule`.
 * Espejo exacto de `CreateTimeBlockDTO` en openapi.yaml. `user_id` se toma del
 * JWT; `start_time < end_time` se valida en el servicio.
 */
export class CreateTimeBlockDto {
  @fields.title
  title!: string;

  @fields.description
  description?: string;

  @fields.start_time
  start_time!: string;

  @fields.end_time
  end_time!: string;

  @fields.actual_duration_minutes
  actual_duration_minutes?: number;

  @fields.category
  category?: TimeBlockCategory;

  @fields.task_id
  task_id?: string;

  @fields.is_completed
  is_completed?: boolean;
}
