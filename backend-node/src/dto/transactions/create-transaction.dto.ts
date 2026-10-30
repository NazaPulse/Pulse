import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '../../models/transaction.entity';
import { Field } from '../../common/decorators/field.decorator';

/**
 * En egresos `category_id` siempre se valida (y por lo tanto es obligatorio); en ingresos
 * solo si viene informado.
 */
function requiresCategory(dto: CreateTransactionDto): boolean {
  return dto.type === TransactionType.EXPENSE || dto.category_id !== undefined;
}

/** Validación y documentación Swagger de cada campo. */
const fields = {
  amount: Field(
    ApiProperty({ format: 'float', exclusiveMinimum: true, minimum: 0, example: 120.75 }),
    IsNumber(),
    IsPositive({ message: 'amount must be greater than 0' }),
  ),
  type: Field(
    ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE }),
    IsEnum(TransactionType, {
      message: 'type must be one of the following values: income, expense',
    }),
  ),
  account_id: Field(ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' }), IsUUID()),
  category_id: Field(
    ApiPropertyOptional({
      format: 'uuid',
      example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b',
      description: 'Obligatorio si `type = expense`; opcional si `type = income`.',
    }),
    ValidateIf(requiresCategory),
    IsUUID('all', { message: 'category_id must be a UUID (required for expense)' }),
  ),
  date: Field(ApiProperty({ format: 'date-time', example: '2026-09-02T18:30:00.000Z' }), IsDateString()),
  description: Field(
    ApiPropertyOptional({ maxLength: 255, example: 'Compra semanal' }),
    IsOptional(),
    IsString(),
    MaxLength(255),
  ),
};

/**
 * Cuerpo de `POST /api/transactions`.
 * Espejo exacto de `TransactionCreateRequest` en openapi.yaml.
 */
export class CreateTransactionDto {
  @fields.amount
  amount!: number;

  @fields.type
  type!: TransactionType;

  @fields.account_id
  account_id!: string;

  @fields.category_id
  category_id?: string;

  @fields.date
  date!: string;

  @fields.description
  description?: string;
}
