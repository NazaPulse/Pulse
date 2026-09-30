import { ApiProperty } from '@nestjs/swagger';

/**
 * Espejo exacto de `CategorySummary` en openapi.yaml.
 */
export class CategorySummaryDto {
  @ApiProperty({ format: 'uuid', example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' })
  category_id!: string;

  @ApiProperty({ maxLength: 100, example: 'Supermercado' })
  category_name!: string;

  @ApiProperty({ maxLength: 50, example: 'shopping-cart' })
  icon!: string;

  @ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })
  color!: string;

  @ApiProperty({ format: 'float', example: 150 })
  total_amount!: number;

  @ApiProperty({ format: 'float', minimum: 0, maximum: 100, example: 75 })
  percentage!: number;
}

/**
 * Respuesta de `GET /api/finances/summary`. Espejo exacto de
 * `FinancesSummary` en openapi.yaml.
 */
export class FinancesSummaryDto {
  @ApiProperty({ format: 'float', example: 18609.75 })
  total_balance!: number;

  @ApiProperty({ format: 'float', example: 3500 })
  total_income!: number;

  @ApiProperty({ format: 'float', example: 200 })
  total_expenses!: number;

  @ApiProperty({ type: CategorySummaryDto, isArray: true })
  by_category!: CategorySummaryDto[];
}
