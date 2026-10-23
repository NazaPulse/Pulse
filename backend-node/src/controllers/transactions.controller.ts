import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { CreateTransactionDto } from '../dto/transactions/create-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/transactions/list-transactions-query.dto';
import { TransactionResponseDto } from '../dto/transactions/transaction-response.dto';
import { TransactionsService } from '../services/transactions.service';

/**
 * Rutas de Transacciones (Issue #13). Reproduce `/api/transactions` de
 * openapi.yaml. Todas las rutas requieren JWT (`bearerAuth`) y filtran
 * obligatoriamente por el usuario autenticado.
 */
@ApiProtected('Transactions')
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listTransactions',
    summary: 'Listar el historial de transacciones del usuario autenticado',
    returns: {
      status: 'ok',
      type: TransactionResponseDto,
      isArray: true,
      description: 'Listado de transacciones del usuario autenticado.',
    },
    badRequest: 'Query params inválidos.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionResponseDto[]> {
    return this.transactions.findAllForUser(user.id, query);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createTransaction',
    summary: 'Registrar un movimiento de dinero',
    returns: {
      status: 'created',
      type: TransactionResponseDto,
      description: 'Transacción registrada correctamente.',
    },
    badRequest: 'Fallo de validación del payload o saldo insuficiente en la cuenta.',
    notFound: 'La cuenta o la categoría no existe o no pertenece al usuario autenticado.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactions.create(user.id, dto);
  }
}
