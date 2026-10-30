import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, MaxLength } from 'class-validator';
import { Field } from '../../common/decorators/field.decorator';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_COLOR_MESSAGE = 'color must match ^#[0-9A-Fa-f]{6}$';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  name: Field(ApiProperty({ maxLength: 100, example: 'Supermercado' }), IsString(), MaxLength(100)),
  target_amount: Field(ApiProperty({ format: 'float', example: 600 }), IsNumber()),
  color: Field(
    ApiProperty({ pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' }),
    IsString(),
    Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE }),
  ),
  icon: Field(ApiProperty({ maxLength: 50, example: 'shopping-cart' }), IsString(), MaxLength(50)),
};

/**
 * Cuerpo de `PUT /api/categories/{id}`.
 * Espejo exacto de `CategoryUpdateRequest` en openapi.yaml: reemplazo total
 * (todos los campos son requeridos).
 */
export class UpdateCategoryDto {
  @fields.name
  name!: string;

  @fields.target_amount
  target_amount!: number;

  @fields.color
  color!: string;

  @fields.icon
  icon!: string;
}
