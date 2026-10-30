import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../models/category.entity';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  id: Field(ApiProperty({ format: 'uuid', example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' })),
  name: Field(ApiProperty({ maxLength: 100, example: 'Supermercado' })),
  target_amount: Field(ApiProperty({ format: 'float', example: 500 })),
  color: Field(ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })),
  icon: Field(ApiProperty({ maxLength: 50, example: 'shopping-cart' })),
  created_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:06:00.000Z' })),
  updated_at: Field(ApiProperty({ format: 'date-time', example: '2026-08-28T14:06:00.000Z' })),
};

/**
 * Respuesta de las rutas de Categorías/Sobres. Espejo exacto de `Category`
 * en openapi.yaml (`color`/`icon` son requeridos y no-nulos en la lectura;
 * {@link CategoriesService.create} aplica valores por defecto cuando el
 * cliente no los envía).
 */
export class CategoryResponseDto {
  @fields.id
  id!: string;

  @fields.name
  name!: string;

  @fields.target_amount
  target_amount!: number;

  @fields.color
  color!: string;

  @fields.icon
  icon!: string;

  @fields.created_at
  created_at!: string;

  @fields.updated_at
  updated_at!: string;

  static fromEntity(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.target_amount = category.targetAmount;
    dto.color = category.color ?? '';
    dto.icon = category.icon ?? '';
    dto.created_at = category.createdAt.toISOString();
    dto.updated_at = category.updatedAt.toISOString();
    return dto;
  }
}
