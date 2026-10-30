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
  content: Field(ApiPropertyOptional({ type: String, nullable: true }), IsOptional(), IsString()),
  audio_url: Field(
    ApiPropertyOptional({ type: String, nullable: true, maxLength: 2048 }),
    IsOptional(),
    IsString(),
    MaxLength(2048),
  ),
};

/**
 * Cuerpo de `PUT /api/notes/{id}` (reemplazo total).
 * Espejo exacto de `UpdateNoteDTO` en openapi.yaml: `content` y `audio_url`
 * omitidos o en `null` quedan vacíos.
 */
export class UpdateNoteDto {
  @fields.title
  title!: string;

  @fields.content
  content?: string | null;

  @fields.audio_url
  audio_url?: string | null;
}
