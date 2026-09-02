import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Cuerpo de `POST /api/auth/login`.
 * Espejo exacto de `LoginRequest` en openapi.yaml.
 */
export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 255, example: 'usuario@pulse.app' })
  @IsEmail({}, { message: 'email must be an email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ minLength: 1, maxLength: 128, example: 'S3gura-y-larga_2026!' })
  @IsString()
  @IsNotEmpty({ message: 'password should not be empty' })
  @MaxLength(128)
  password!: string;
}
