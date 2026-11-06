import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { NOT_FOUND_MESSAGE } from '../common/owned-records';
import { Account } from '../models/account.entity';
import { Category } from '../models/category.entity';
import { CreateTransactionDto } from '../dto/transactions/create-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/transactions/list-transactions-query.dto';
import { TransactionResponseDto } from '../dto/transactions/transaction-response.dto';
import { Transaction, TransactionType } from '../models/transaction.entity';

export const INSUFFICIENT_FUNDS_MESSAGE = 'Saldo insuficiente en la cuenta';

const toResponse = (row: Transaction) => TransactionResponseDto.fromEntity(row);
const newestFirst = { date: 'DESC', createdAt: 'DESC' } as const;

/** Filtros opcionales del historial (siempre acotado al usuario). */
function transactionFilters(userId: string, query: ListTransactionsQueryDto): FindOptionsWhere<Transaction> {
  const where: FindOptionsWhere<Transaction> = { userId };
  if (query.account_id) where.accountId = query.account_id;
  if (query.category_id) where.categoryId = query.category_id;
  if (query.type) where.type = query.type;
  return where;
}

/**
 * Historial y alta de movimientos.
 *
 * `create` aplica la lógica de doble impacto (Issue #13). Todo ocurre en una única transacción
 * de base de datos: validar la cuenta (con lock de fila para evitar carreras sobre `balance`),
 * validar la categoría, ajustar el saldo e insertar el movimiento. Ante cualquier error se hace
 * ROLLBACK y la cuenta no cambia.
 *
 * La "ejecución" de cada sobre no tiene columna propia en `categories`: se deriva de la suma de
 * sus egresos (ver `FinancesService.getSummary`), por lo que queda consistente al confirmarse
 * este mismo INSERT.
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
  ) {}

  async findAllForUser(userId: string, query: ListTransactionsQueryDto) {
    const rows = await this.transactions.find({ where: transactionFilters(userId, query), order: newestFirst });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const saved = await stageTransaction(runner.manager, userId, dto);
      await runner.commitTransaction();
      return toResponse(saved);
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }
}

/**
 * Pasos de `create` dentro de la transacción abierta. No confirma nada:
 * `create` hace COMMIT o ROLLBACK de todo junto.
 */
async function stageTransaction(
  manager: EntityManager,
  userId: string,
  dto: CreateTransactionDto,
): Promise<Transaction> {
  const account = await lockAccount(manager, userId, dto.account_id);
  const categoryId = await ownedCategoryId(manager, userId, dto.category_id);
  applyImpact(account, dto);
  await manager.save(Account, account);

  return manager.save(
    Transaction,
    manager.create(Transaction, {
      userId,
      accountId: account.id,
      categoryId,
      amount: dto.amount,
      type: dto.type,
      date: new Date(dto.date),
      description: dto.description ?? null,
    }),
  );
}

/** Cuenta activa del usuario con lock de escritura; `404` si no existe. */
async function lockAccount(manager: EntityManager, userId: string, accountId: string): Promise<Account> {
  const account = await manager.findOne(Account, {
    where: { id: accountId, userId, isActive: true },
    lock: { mode: 'pessimistic_write' },
  });
  if (!account) {
    throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
  return account;
}

/** `null` si no se envió categoría; `404` si no existe o es de otro usuario. */
async function ownedCategoryId(
  manager: EntityManager,
  userId: string,
  categoryId: string | undefined,
): Promise<string | null> {
  if (categoryId === undefined) return null;
  const category = await manager.findOne(Category, { where: { id: categoryId, userId } });
  if (!category) {
    throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
  return category.id;
}

/** Ajusta el saldo; un egreso sin saldo suficiente responde `400` sin tocar la cuenta. */
function applyImpact(account: Account, dto: CreateTransactionDto): void {
  if (dto.type !== TransactionType.EXPENSE) {
    account.balance = round2(account.balance + dto.amount);
    return;
  }
  if (account.balance < dto.amount) {
    throw new BadRequestException(INSUFFICIENT_FUNDS_MESSAGE);
  }
  account.balance = round2(account.balance - dto.amount);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
