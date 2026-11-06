import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../../models/account.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  name: Field(ApiProperty({ maxLength: 100, example: 'Cuenta Corriente Santander' }), IsString(), MaxLength(100)),
  type: Field(
    ApiProperty({ enum: AccountType, example: AccountType.BANK }),
    IsEnum(AccountType, {
      message: 'type must be one of the following values: bank, wallet, cash',
    }),
  ),
  initial_balance: Field(
    ApiPropertyOptional({
      format: 'float',
      default: 0,
      example: 15230.5,
      description: 'Saldo inicial de la cuenta. Se usa como base para calcular `balance`.',
    }),
    IsOptional(),
    IsNumber(),
  ),
};

/**
 * Cuerpo de `POST /api/accounts`.
 * Espejo exacto de `AccountCreateRequest` en openapi.yaml.
 */
export class CreateAccountDto {
  @fields.name
  name!: string;

  @fields.type
  type!: AccountType;

  @fields.initial_balance
  initial_balance?: number;
}
