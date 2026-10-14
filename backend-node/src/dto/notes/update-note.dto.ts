import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Cuerpo de `PUT /api/notes/{id}` (reemplazo total).
 * Espejo exacto de `UpdateNoteDTO` en openapi.yaml: `content` y `audio_url`
 * omitidos o en `null` quedan vacíos.
 */
export class UpdateNoteDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Ideas de ahorro' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  audio_url?: string | null;
}
