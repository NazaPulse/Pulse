import { ApiProperty } from '@nestjs/swagger';
import { Account, AccountType } from '../../models/account.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' })),
  name: Field(ApiProperty({ maxLength: 100, example: 'Cuenta Corriente Santander' })),
  type: Field(ApiProperty({ enum: AccountType, example: AccountType.BANK })),
  balance: Field(ApiProperty({ format: 'float', example: 15230.5 })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })),
};

/**
 * Respuesta de las rutas de Cuentas. Espejo exacto de `Account` en
 * openapi.yaml.
 */
export class AccountResponseDto {
  @fields.id
  id!: string;

  @fields.name
  name!: string;

  @fields.type
  type!: AccountType;

  @fields.balance
  balance!: number;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
  updated_at!: string;

  static fromEntity(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.type = account.type;
    dto.balance = account.balance;
    dto.created_at = account.createdAt.toISOString();
    dto.updated_at = account.updatedAt.toISOString();
    return dto;
  }
}
