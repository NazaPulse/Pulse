import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../note.entity';

/**
 * Respuesta de las rutas de Notas. Espejo exacto de `Note` en openapi.yaml.
 */
export class NoteResponseDto {
  @ApiProperty({ format: 'uuid', example: '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a' })
  id!: string;

  @ApiProperty({ maxLength: 200, example: 'Ideas de ahorro' })
  title!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Revisar suscripciones mensuales.' })
  content!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    maxLength: 2048,
    example: '/uploads/audio/5f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f.webm',
  })
  audio_url!: string | null;

  @ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })
  user_id!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })
  updated_at!: string;

  static fromEntity(note: Note): NoteResponseDto {
    const dto = new NoteResponseDto();
    dto.id = note.id;
    dto.title = note.title;
    dto.content = note.content ?? null;
    dto.audio_url = note.audioUrl ?? null;
    dto.user_id = note.userId;
    dto.created_at = note.createdAt.toISOString();
    dto.updated_at = note.updatedAt.toISOString();
    return dto;
  }
}
