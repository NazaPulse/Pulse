import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, MaxLength } from 'class-validator';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_COLOR_MESSAGE = 'color must match ^#[0-9A-Fa-f]{6}$';

/**
 * Cuerpo de `PUT /api/categories/{id}`.
 * Espejo exacto de `CategoryUpdateRequest` en openapi.yaml: reemplazo total
 * (todos los campos son requeridos).
 */
export class UpdateCategoryDto {
  @ApiProperty({ maxLength: 100, example: 'Supermercado' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ format: 'float', example: 600 })
  @IsNumber()
  target_amount!: number;

  @ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })
  @IsString()
  @Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })
  color!: string;

  @ApiProperty({ maxLength: 50, example: 'shopping-cart' })
  @IsString()
  @MaxLength(50)
  icon!: string;
}
