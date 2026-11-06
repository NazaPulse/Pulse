import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { Field } from '../../common/decorators/field.decorator';

/** Validación y documentación Swagger de cada campo. */
const fields = {
  from: Field(ApiPropertyOptional({ format: 'date-time' }), IsOptional(), IsDateString({ strict: true })),
  to: Field(ApiPropertyOptional({ format: 'date-time' }), IsOptional(), IsDateString({ strict: true })),
};

/**
 * Query params opcionales de `GET /api/schedule` (openapi.yaml): rango con el
 * que deben superponerse los bloques devueltos.
 */
export class ListScheduleQueryDto {
  @fields.from
  from?: string;

  @fields.to
  to?: string;
}
