import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TransactionType } from '../../models/transaction.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  account_id: Field(ApiPropertyOptional({ format: 'uuid' }), IsOptional(), IsUUID()),
  category_id: Field(ApiPropertyOptional({ format: 'uuid' }), IsOptional(), IsUUID()),
  type: Field(
    ApiPropertyOptional({ enum: TransactionType }),
    IsOptional(),
    IsEnum(TransactionType, {
      message: 'type must be one of the following values: income, expense',
    }),
  ),
};

/**
 * Query params opcionales de `GET /api/transactions` (openapi.yaml).
 * Los filtros se combinan con AND lógico.
 */
export class ListTransactionsQueryDto {
  @fields.account_id
  account_id?: string;

  @fields.category_id
  category_id?: string;

  @fields.type
  type?: TransactionType;
}
