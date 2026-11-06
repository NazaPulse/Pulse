import { UserId } from '../common/decorators/current-user.decorator';
import { FinancesService } from '../services/finances.service';
import { FinancesRoutes } from './routes/finances.routes';

/** Resumen financiero del usuario autenticado (ruta documentada en {@link FinancesRoutes}). */
@FinancesRoutes.controller
export class FinancesController {
  constructor(private readonly finances: FinancesService) {}

  @FinancesRoutes.summary
  summary(@UserId() userId: string) {
    return this.finances.getSummary(userId);
  }
}
