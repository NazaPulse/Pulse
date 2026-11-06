import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../../models/account.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  name: Field(ApiProperty({ maxLength: 100, example: 'Cuenta Corriente (Santander)' }), IsString(), MaxLength(100)),
  type: Field(
    ApiProperty({ enum: AccountType, example: AccountType.BANK }),
    IsEnum(AccountType, {
      message: 'type must be one of the following values: bank, wallet, cash',
    }),
  ),
};

/**
 * Cuerpo de `PUT /api/accounts/{id}`.
 * Espejo exacto de `AccountUpdateRequest` en openapi.yaml: reemplaza `name`
 * y `type`. `balance` no es editable manualmente (se recalcula a partir de
 * las transacciones asociadas), por lo que no forma parte de este DTO.
 */
export class UpdateAccountDto {
  @fields.name
  name!: string;

  @fields.type
  type!: AccountType;
}
