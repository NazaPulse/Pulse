import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /api/auth/register`.
 * Espejo exacto de `RegisterRequest` en openapi.yaml (additionalProperties: false
 * se hace cumplir con el ValidationPipe global: whitelist + forbidNonWhitelisted).
 */
export class RegisterDto {
  @ApiProperty({ format: 'email', maxLength: 255, example: 'usuario@pulse.app' })
  @IsEmail({}, { message: 'email must be an email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 128,
    example: 'S3gura-y-larga_2026!',
    description:
      'Contraseña en texto plano. Se almacena hasheada con Argon2id (perfil OWASP).',
  })
  @IsString()
  @MinLength(12, {
    message: 'password must be longer than or equal to 12 characters',
  })
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true, example: 'Ada Lovelace' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;
}
