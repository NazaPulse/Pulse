import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../account.entity';

/**
 * Cuerpo de `POST /api/accounts`.
 * Espejo exacto de `AccountCreateRequest` en openapi.yaml.
 */
export class CreateAccountDto {
  @ApiProperty({ maxLength: 100, example: 'Cuenta Corriente Santander' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.BANK })
  @IsEnum(AccountType, {
    message: 'type must be one of the following values: bank, wallet, cash',
  })
  type!: AccountType;

  @ApiPropertyOptional({
    format: 'float',
    default: 0,
    example: 15230.5,
    description: 'Saldo inicial de la cuenta. Se usa como base para calcular `balance`.',
  })
  @IsOptional()
  @IsNumber()
  initial_balance?: number;
}
