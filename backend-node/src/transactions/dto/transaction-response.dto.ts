import { ApiProperty } from '@nestjs/swagger';
import { Transaction, TransactionType } from '../transaction.entity';

/**
 * Respuesta de las rutas de Transacciones. Espejo exacto de `Transaction` en
 * openapi.yaml.
 */
export class TransactionResponseDto {
  @ApiProperty({ format: 'uuid', example: '9a8b7c6d-5e4f-4a3b-9c2d-1e0f2a3b4c5d' })
  id!: string;

  @ApiProperty({ format: 'float', example: 120.75 })
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  type!: TransactionType;

  @ApiProperty({ format: 'uuid', example: '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f' })
  account_id!: string;

  @ApiProperty({ format: 'uuid', nullable: true, type: String, example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' })
  category_id!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-09-02T18:30:00.000Z' })
  date!: string;

  @ApiProperty({ maxLength: 255, nullable: true, type: String, example: 'Compra semanal' })
  description!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-09-02T18:31:00.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-02T18:31:00.000Z' })
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
