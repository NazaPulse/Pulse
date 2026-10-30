import { Body, Query } from '@nestjs/common';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateTransactionDto } from '../dto/transactions/create-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/transactions/list-transactions-query.dto';
import { TransactionsService } from '../services/transactions.service';
import { TransactionsRoutes } from './routes/transactions.routes';

/** Transacciones del usuario autenticado (rutas documentadas en {@link TransactionsRoutes}). */
@TransactionsRoutes.controller
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @TransactionsRoutes.list
  list(@UserId() userId: string, @Query() query: ListTransactionsQueryDto) {
    return this.transactions.findAllForUser(userId, query);
  }

  @TransactionsRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(userId, dto);
  }
}
