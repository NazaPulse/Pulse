import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../category.entity';

/**
 * Respuesta de las rutas de Categorías/Sobres. Espejo exacto de `Category`
 * en openapi.yaml (`color`/`icon` son requeridos y no-nulos en la lectura;
 * {@link CategoriesService.create} aplica valores por defecto cuando el
 * cliente no los envía).
 */
export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid', example: '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b' })
  id!: string;

  @ApiProperty({ maxLength: 100, example: 'Supermercado' })
  name!: string;

  @ApiProperty({ format: 'float', example: 500 })
  target_amount!: number;

  @ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })
  color!: string;

  @ApiProperty({ maxLength: 50, example: 'shopping-cart' })
  icon!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:06:00.000Z' })
  created_at!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-28T14:06:00.000Z' })
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
