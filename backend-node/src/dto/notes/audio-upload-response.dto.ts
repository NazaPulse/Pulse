import { ApiProperty } from '@nestjs/swagger';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  audio_url: Field(
    ApiProperty({
      maxLength: 2048,
      example: '/uploads/audio/5f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f.webm',
    }),
  ),
};

/** Espejo exacto de `AudioUploadResponse` en openapi.yaml. */
export class AudioUploadResponseDto {
  @fields.audio_url
  audio_url!: string;
}
