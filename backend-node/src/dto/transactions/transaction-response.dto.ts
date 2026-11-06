import { ApiProperty } from '@nestjs/swagger';
import { Transaction, TransactionType } from '../../models/transaction.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '9a8b7c6d-5e4f-4a3b-9c2d-1e0f2a3b4c5d' })),
  amount: Field(ApiProperty({ format: 'float', example: 120.75 })),
  type: Field(ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })),
  account_id: Field(ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' })),
  category_id: Field(
    ApiProperty({ format: 'uuid', nullable: true, type: String, example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' }),
  ),
  date: Field(ApiProperty({ format: 'date-time', example: '2026-09-02T18:30:00.000Z' })),
  description: Field(ApiProperty({ maxLength: 255, nullable: true, type: String, example: 'Compra semanal' })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-09-02T18:31:00.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-09-02T18:31:00.000Z' })),
};

/**
 * Respuesta de las rutas de Transacciones. Espejo exacto de `Transaction` en
 * openapi.yaml.
 */
export class TransactionResponseDto {
  @fields.id
  id!: string;

  @fields.amount
  amount!: number;

  @fields.type
  type!: TransactionType;

  @fields.account_id
  account_id!: string;

  @fields.category_id
  category_id!: string | null;

  @fields.date
  date!: string;

  @fields.description
  description!: string | null;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
  updated_at!: string;

  static fromEntity(tx: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = tx.id;
    dto.amount = tx.amount;
    dto.type = tx.type;
    dto.account_id = tx.accountId;
    dto.category_id = tx.categoryId;
    dto.date = new Date(tx.date).toISOString();
    dto.description = tx.description;
    dto.created_at = tx.createdAt.toISOString();
    dto.updated_at = tx.updatedAt.toISOString();
    return dto;
  }
}
