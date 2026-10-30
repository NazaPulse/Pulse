import { ApiProperty } from '@nestjs/swagger';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  category_id: Field(ApiProperty({ format: 'uuid', example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' })),
  category_name: Field(ApiProperty({ maxLength: 100, example: 'Supermercado' })),
  icon: Field(ApiProperty({ maxLength: 50, example: 'shopping-cart' })),
  color: Field(ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })),
  total_amount: Field(ApiProperty({ format: 'float', example: 150 })),
  percentage: Field(ApiProperty({ format: 'float', minimum: 0, maximum: 100, example: 75 })),
};

/**
 * Espejo exacto de `CategorySummary` en openapi.yaml.
 */
export class CategorySummaryDto {
  @fields.category_id
  category_id!: string;

  @fields.category_name
  category_name!: string;

  @fields.icon
  icon!: string;

  @fields.color
  color!: string;

  @fields.total_amount
  total_amount!: number;

  @fields.percentage
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
