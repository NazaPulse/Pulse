import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../models/user.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071' })),
  email: Field(ApiProperty({ format: 'email', example: 'usuario@pulse.app' })),
  full_name: Field(ApiProperty({ nullable: true, example: 'Ada Lovelace' })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })),
};

/**
 * Respuesta `201` de `POST /api/auth/register`.
 * Espejo exacto de `UserPublic` en openapi.yaml. NUNCA incluye `password_hash`.
 */
export class UserPublicDto {
  @fields.id
  id!: string;

  @fields.email
  email!: string;

  @fields.full_name
  full_name!: string | null;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
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
