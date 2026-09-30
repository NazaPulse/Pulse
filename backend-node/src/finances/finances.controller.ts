import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancesSummaryDto } from './dto/finances-summary.dto';
import { FinancesService } from './finances.service';

/**
 * Resumen financiero (Issue #13). Reproduce `/api/finances/summary` de
 * openapi.yaml. Requiere JWT (`bearerAuth`).
 */
@ApiTags('Finances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/finances')
export class FinancesController {
  constructor(private readonly finances: FinancesService) {}

  @Get('summary')
  @ApiOperation({ operationId: 'getFinancesSummary', summary: 'Obtener el resumen financiero del usuario autenticado' })
  @ApiOkResponse({ type: FinancesSummaryDto, description: 'Resumen financiero calculado.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  summary(@CurrentUser() user: AuthenticatedUser): Promise<FinancesSummaryDto> {
    return this.finances.getSummary(user.id);
  }
}
