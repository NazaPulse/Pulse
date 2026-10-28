import { ApiProperty } from '@nestjs/swagger';
import { TimeBlock, TimeBlockCategory } from '../../models/time-block.entity';

/**
 * Respuesta de las rutas del Cronograma. Espejo exacto de `TimeBlock` en openapi.yaml.
 */
export class TimeBlockResponseDto {
  @ApiProperty({ format: 'uuid', example: '7c6b5a49-3827-4165-9d4c-3b2a19087f6e' })
  id!: string;

  @ApiProperty({ maxLength: 200, example: 'Pagar la tarjeta de crédito' })
  title!: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 1000, example: 'Revisar el resumen antes de pagar' })
  description!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T13:00:00.000Z' })
  start_time!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T14:30:00.000Z' })
  end_time!: string;

  @ApiProperty({ type: Number, minimum: 0, default: 0, example: 50 })
  actual_duration_minutes!: number;

  @ApiProperty({ enum: TimeBlockCategory, example: TimeBlockCategory.WORK })
  category!: TimeBlockCategory;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, example: '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9' })
  task_id!: string | null;

  @ApiProperty({ example: false })
  is_completed!: boolean;

  @ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })
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
