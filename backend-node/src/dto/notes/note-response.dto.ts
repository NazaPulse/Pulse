import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../models/note.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a' })),
  title: Field(ApiProperty({ maxLength: 200, example: 'Ideas de ahorro' })),
  content: Field(ApiProperty({ type: String, nullable: true, example: 'Revisar suscripciones mensuales.' })),
  audio_url: Field(
    ApiProperty({
      type: String,
      nullable: true,
      maxLength: 2048,
      example: '/uploads/audio/5f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f.webm',
    }),
  ),
  user_id: Field(ApiProperty({ format: 'uuid', example: '2f1e0d9c-8b7a-4695-8483-726150493827' })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-10-07T12:00:00.000Z' })),
};

/**
 * Respuesta de las rutas de Notas. Espejo exacto de `Note` en openapi.yaml.
 */
export class NoteResponseDto {
  @fields.id
  id!: string;

  @fields.title
  title!: string;

  @fields.content
  content!: string | null;

  @fields.audio_url
  audio_url!: string | null;

  @fields.user_id
  user_id!: string;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
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
