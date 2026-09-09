import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../account.entity';

/**
 * Cuerpo de `PUT /api/accounts/{id}`.
 * Espejo exacto de `AccountUpdateRequest` en openapi.yaml: reemplaza `name`
 * y `type`. `balance` no es editable manualmente (se recalcula a partir de
 * las transacciones asociadas), por lo que no forma parte de este DTO.
 */
export class UpdateAccountDto {
  @ApiProperty({ maxLength: 100, example: 'Cuenta Corriente (Santander)' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.BANK })
  @IsEnum(AccountType, {
    message: 'type must be one of the following values: bank, wallet, cash',
  })
  type!: AccountType;
}
