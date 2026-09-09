import { ApiProperty } from '@nestjs/swagger';
import { Account, AccountType } from '../account.entity';

/**
 * Respuesta de las rutas de Cuentas. Espejo exacto de `Account` en
 * openapi.yaml.
 */
export class AccountResponseDto {
  @ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' })
  id!: string;

  @ApiProperty({ maxLength: 100, example: 'Cuenta Corriente Santander' })
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.BANK })
  type!: AccountType;

  @ApiProperty({ format: 'float', example: 15230.5 })
  balance!: number;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' })
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
