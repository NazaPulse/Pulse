import { Controller, Get } from '@nestjs/common';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { FinancesSummaryDto } from '../dto/finances/finances-summary.dto';
import { FinancesService } from '../services/finances.service';

/**
 * Resumen financiero (Issue #13). Reproduce `/api/finances/summary` de
 * openapi.yaml. Requiere JWT (`bearerAuth`).
 */
@ApiProtected('Finances')
@Controller('api/finances')
export class FinancesController {
  constructor(private readonly finances: FinancesService) {}

  @Get('summary')
  @ApiEndpoint({
    operationId: 'getFinancesSummary',
    summary: 'Obtener el resumen financiero del usuario autenticado',
    returns: { status: 'ok', type: FinancesSummaryDto, description: 'Resumen financiero calculado.' },
  })
  summary(@CurrentUser() user: AuthenticatedUser): Promise<FinancesSummaryDto> {
    return this.finances.getSummary(user.id);
  }
}
