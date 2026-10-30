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
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  title: Field(
    ApiPropertyOptional({ minLength: 1, maxLength: 200 }),
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
  start_time: Field(ApiPropertyOptional({ format: 'date-time' }), IsOptional(), IsDateString({ strict: true })),
  end_time: Field(ApiPropertyOptional({ format: 'date-time' }), IsOptional(), IsDateString({ strict: true })),
  actual_duration_minutes: Field(ApiPropertyOptional({ type: Number, minimum: 0 }), IsOptional(), IsInt(), Min(0)),
  category: Field(
    ApiPropertyOptional({ enum: TimeBlockCategory }),
    IsOptional(),
    IsEnum(TimeBlockCategory, { message: CATEGORY_ENUM_MESSAGE }),
  ),
  task_id: Field(
    ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }),
    ValidateIf((_o, value) => value !== null && value !== undefined),
    IsUUID(),
  ),
  is_completed: Field(ApiPropertyOptional(), IsOptional(), IsBoolean()),
};

/**
 * Cuerpo de `PATCH /api/schedule/{id}`.
 * Espejo exacto de `UpdateTimeBlockDTO` en openapi.yaml: edición parcial, debe
 * enviarse al menos un campo (validado en el servicio). `description` y
 * `task_id` aceptan `null` para eliminarlos.
 */
export class UpdateTimeBlockDto {
  @fields.title
  title?: string;

  @fields.description
  description?: string | null;

  @fields.start_time
  start_time?: string;

  @fields.end_time
  end_time?: string;

  @fields.actual_duration_minutes
  actual_duration_minutes?: number;

  @fields.category
  category?: TimeBlockCategory;

  @fields.task_id
  task_id?: string | null;

  @fields.is_completed
  is_completed?: boolean;
}
