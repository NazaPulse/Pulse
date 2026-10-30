import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  title: Field(
    ApiProperty({ minLength: 1, maxLength: 200, example: 'Ideas de ahorro' }),
    IsString(),
    MinLength(1),
    MaxLength(200),
  ),
  content: Field(ApiPropertyOptional({ example: 'Revisar suscripciones mensuales.' }), IsOptional(), IsString()),
  audio_url: Field(
    ApiPropertyOptional({
      maxLength: 2048,
      example: '/uploads/audio/5f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f.webm',
    }),
    IsOptional(),
    IsString(),
    MaxLength(2048),
  ),
};

/**
 * Cuerpo de `POST /api/notes`.
 * Espejo exacto de `CreateNoteDTO` en openapi.yaml. `user_id` se toma del JWT.
 */
export class CreateNoteDto {
  @fields.title
  title!: string;

  @fields.content
  content?: string;

  @fields.audio_url
  audio_url?: string;
}
