import { ApiProperty } from '@nestjs/swagger';

/**
 * Respuesta `200` de `POST /api/auth/login`.
 * Espejo exacto de `LoginResponse` en openapi.yaml: { "access_token": "string" }.
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT firmado (Authorization: Bearer <access_token>).',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjFhMmI0Yy01ZDZlLTdmODAtOWExYi0yYzNkNGU1ZjYwNzEifQ.q7m0nS9nT3n2Yy8mS0dQ0vBv0f0m8bqkq2s8y4d1a2c',
  })
  access_token!: string;
}
