import { ApiProperty } from '@nestjs/swagger';
import { TimeBlock, TimeBlockCategory } from '../../models/time-block.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '7c6b5a49-3827-4165-9d4c-3b2a19087f6e' })),
  title: Field(ApiProperty({ maxLength: 200, example: 'Pagar la tarjeta de crédito' })),
  description: Field(
    ApiProperty({ type: String, nullable: true, maxLength: 1000, example: 'Revisar el resumen antes de pagar' }),
  ),
  start_time: Field(ApiProperty({ format: 'date-time', example: '2026-10-28T13:00:00.000Z' })),
  end_time: Field(ApiProperty({ format: 'date-time', example: '2026-10-28T14:30:00.000Z' })),
  actual_duration_minutes: Field(ApiProperty({ type: Number, minimum: 0, default: 0, example: 50 })),
  category: Field(ApiProperty({ enum: TimeBlockCategory, example: TimeBlockCategory.WORK })),
  task_id: Field(
    ApiProperty({ type: String, format: 'uuid', nullable: true, example: '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9' }),
  ),
  is_completed: Field(ApiProperty({ example: false })),
  user_id: Field(ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })),
};

/**
 * Respuesta de las rutas del Cronograma. Espejo exacto de `TimeBlock` en openapi.yaml.
 */
export class TimeBlockResponseDto {
  @fields.id
  id!: string;

  @fields.title
  title!: string;

  @fields.description
  description!: string | null;

  @fields.start_time
  start_time!: string;

  @fields.end_time
  end_time!: string;

  @fields.actual_duration_minutes
  actual_duration_minutes!: number;

  @fields.category
  category!: TimeBlockCategory;

  @fields.task_id
  task_id!: string | null;

  @fields.is_completed
  is_completed!: boolean;

  @fields.user_id
  user_id!: string;

  static fromEntity(block: TimeBlock): TimeBlockResponseDto {
    const dto = new TimeBlockResponseDto();
    dto.id = block.id;
    dto.title = block.title;
    dto.description = block.description ?? null;
    dto.start_time = block.startTime.toISOString();
    dto.end_time = block.endTime.toISOString();
    dto.actual_duration_minutes = block.actualDurationMinutes;
    dto.category = block.category;
    dto.task_id = block.taskId ?? null;
    dto.is_completed = block.isCompleted;
    dto.user_id = block.userId;
    return dto;
  }
}
