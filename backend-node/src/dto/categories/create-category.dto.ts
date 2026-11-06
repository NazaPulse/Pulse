import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Field } from '../../common/decorators/field.decorator';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_COLOR_MESSAGE = 'color must match ^#[0-9A-Fa-f]{6}$';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  name: Field(ApiProperty({ maxLength: 100, example: 'Supermercado' }), IsString(), MaxLength(100)),
  target_amount: Field(
    ApiProperty({
      format: 'float',
      example: 500,
      description: 'Monto objetivo (presupuesto) asignado al sobre.',
    }),
    IsNumber(),
  ),
  color: Field(
    ApiPropertyOptional({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' }),
    IsOptional(),
    IsString(),
    Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE }),
  ),
  icon: Field(
    ApiPropertyOptional({ maxLength: 50, example: 'shopping-cart' }),
    IsOptional(),
    IsString(),
    MaxLength(50),
  ),
};

/**
 * Cuerpo de `POST /api/categories`.
 * Espejo exacto de `CategoryCreateRequest` en openapi.yaml.
 */
export class CreateCategoryDto {
  @fields.name
  name!: string;

  @fields.target_amount
  target_amount!: number;

  @fields.color
  color?: string;

  @fields.icon
  icon?: string;
}
