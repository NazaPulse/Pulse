import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

/**
 * Respuesta `201` de `POST /api/auth/register`.
 * Espejo exacto de `UserPublic` en openapi.yaml. NUNCA incluye `password_hash`.
 */
export class UserPublicDto {
  @ApiProperty({ format: 'uuid', example: '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071' })
  id!: string;

  @ApiProperty({ format: 'email', example: 'usuario@pulse.app' })
  email!: string;

  @ApiProperty({ nullable: true, example: 'Ada Lovelace' })
  full_name!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })
  updated_at!: string;

  static fromEntity(user: User): UserPublicDto {
    const dto = new UserPublicDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.full_name = user.fullName ?? null;
    dto.created_at = user.createdAt.toISOString();
    dto.updated_at = user.updatedAt.toISOString();
    return dto;
  }
}
