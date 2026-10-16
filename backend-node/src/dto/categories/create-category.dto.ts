import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_COLOR_MESSAGE = 'color must match ^#[0-9A-Fa-f]{6}$';

/**
 * Cuerpo de `POST /api/categories`.
 * Espejo exacto de `CategoryCreateRequest` en openapi.yaml.
 */
export class CreateCategoryDto {
  @ApiProperty({ maxLength: 100, example: 'Supermercado' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    format: 'float',
    example: 500,
    description: 'Monto objetivo (presupuesto) asignado al sobre.',
  })
  @IsNumber()
  target_amount!: number;

  @ApiPropertyOptional({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })
  color?: string;

  @ApiPropertyOptional({ maxLength: 50, example: 'shopping-cart' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
