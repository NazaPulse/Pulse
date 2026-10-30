import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { FinancesSummaryDto } from '../../dto/finances/finances-summary.dto';

/**
 * Resumen financiero (Issue #13). Reproduce `/api/finances/summary` de
 * openapi.yaml. Requiere JWT (`bearerAuth`).
 */
export const FinancesRoutes = {
  controller: ApiResource('Finances', 'api/finances'),
  summary: ApiRoute('get', 'summary', {
    operationId: 'getFinancesSummary',
    summary: 'Obtener el resumen financiero del usuario autenticado',
    returns: { status: 'ok', type: FinancesSummaryDto, description: 'Resumen financiero calculado.' },
  }),
};
