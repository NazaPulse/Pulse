import { ApiProperty } from '@nestjs/swagger';

/**
 * Respuesta `200` de `POST /api/auth/login`.
 * Espejo exacto de `LoginResponse` en openapi.yaml (un único campo `access_token`).
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT firmado (Authorization: Bearer <access_token>).',
    format: 'jwt',
  })
  access_token!: string;
}
