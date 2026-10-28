import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/**
 * Query params opcionales de `GET /api/schedule` (openapi.yaml): rango con el
 * que deben superponerse los bloques devueltos.
 */
export class ListScheduleQueryDto {
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
