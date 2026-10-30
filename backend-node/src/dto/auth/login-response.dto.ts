import { ApiProperty } from '@nestjs/swagger';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  access_token: Field(
    ApiProperty({
      description: 'Token de acceso JWT firmado (Authorization: Bearer <access_token>).',
      format: 'jwt',
    }),
  ),
};

/**
 * Respuesta `200` de `POST /api/auth/login`.
 * Espejo exacto de `LoginResponse` en openapi.yaml (un único campo `access_token`).
 */
export class LoginResponseDto {
  @fields.access_token
  access_token!: string;
}
