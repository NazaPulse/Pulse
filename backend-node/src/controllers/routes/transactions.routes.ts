import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { TransactionResponseDto } from '../../dto/transactions/transaction-response.dto';

/**
 * Rutas de Transacciones (Issue #13). Reproduce `/api/transactions` de
 * openapi.yaml. Todas las rutas requieren JWT (`bearerAuth`) y filtran
 * obligatoriamente por el usuario autenticado.
 */
export const TransactionsRoutes = {
  controller: ApiResource('Transactions', 'api/transactions'),
  list: ApiRoute('get', undefined, {
    operationId: 'listTransactions',
    summary: 'Listar el historial de transacciones del usuario autenticado',
    returns: {
      status: 'ok',
      type: TransactionResponseDto,
      isArray: true,
      description: 'Listado de transacciones del usuario autenticado.',
    },
    badRequest: 'Query params inválidos.',
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createTransaction',
    summary: 'Registrar un movimiento de dinero',
    returns: {
      status: 'created',
      type: TransactionResponseDto,
      description: 'Transacción registrada correctamente.',
    },
    badRequest: 'Fallo de validación del payload o saldo insuficiente en la cuenta.',
    notFound: 'La cuenta o la categoría no existe o no pertenece al usuario autenticado.',
  }),
};
