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
import { TransactionType } from '../transaction.entity';

/**
 * Cuerpo de `POST /api/transactions`.
 * Espejo exacto de `TransactionCreateRequest` en openapi.yaml.
 */
export class CreateTransactionDto {
  @ApiProperty({ format: 'float', exclusiveMinimum: true, minimum: 0, example: 120.75 })
  @IsNumber()
  @IsPositive({ message: 'amount must be greater than 0' })
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType, {
    message: 'type must be one of the following values: income, expense',
  })
  type!: TransactionType;

  @ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' })
  @IsUUID()
  account_id!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b',
    description: 'Obligatorio si `type = expense`; opcional si `type = income`.',
  })
  // En egresos siempre se valida (y por lo tanto es obligatorio); en ingresos
  // solo si viene informado.
  @ValidateIf((dto: CreateTransactionDto) => dto.type === TransactionType.EXPENSE || dto.category_id !== undefined)
  @IsUUID('all', { message: 'category_id must be a UUID (required for expense)' })
  category_id?: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-02T18:30:00.000Z' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'Compra semanal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
