import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TransactionType } from '../transaction.entity';

/**
 * Query params opcionales de `GET /api/transactions` (openapi.yaml).
 * Los filtros se combinan con AND lógico.
 */
export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType, {
    message: 'type must be one of the following values: income, expense',
  })
  type?: TransactionType;
}
