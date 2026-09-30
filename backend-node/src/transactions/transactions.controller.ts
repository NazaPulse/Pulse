import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

/**
 * Rutas de Transacciones (Issue #13). Reproduce `/api/transactions` de
 * openapi.yaml. Todas las rutas requieren JWT (`bearerAuth`) y filtran
 * obligatoriamente por el usuario autenticado.
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiOperation({ operationId: 'listTransactions', summary: 'Listar el historial de transacciones del usuario autenticado' })
  @ApiOkResponse({ type: TransactionResponseDto, isArray: true, description: 'Listado de transacciones del usuario autenticado.' })
  @ApiBadRequestResponse({ description: 'Query params inválidos.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionResponseDto[]> {
    return this.transactions.findAllForUser(user.id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createTransaction', summary: 'Registrar un movimiento de dinero' })
  @ApiCreatedResponse({ type: TransactionResponseDto, description: 'Transacción registrada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación del payload o saldo insuficiente en la cuenta.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'La cuenta o la categoría no existe o no pertenece al usuario autenticado.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactions.create(user.id, dto);
  }
}
