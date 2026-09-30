import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { Category } from '../categories/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { Transaction, TransactionType } from './transaction.entity';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';
export const INSUFFICIENT_FUNDS_MESSAGE = 'Saldo insuficiente en la cuenta';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
  ) {}

  async findAllForUser(
    userId: string,
    query: ListTransactionsQueryDto,
  ): Promise<TransactionResponseDto[]> {
    const where: FindOptionsWhere<Transaction> = { userId };
    if (query.account_id) where.accountId = query.account_id;
    if (query.category_id) where.categoryId = query.category_id;
    if (query.type) where.type = query.type;

    const rows = await this.transactions.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return rows.map((row) => TransactionResponseDto.fromEntity(row));
  }

  /**
   * Lógica de doble impacto (Issue #13). Todo ocurre en una única transacción
   * de base de datos: validar la cuenta (con lock de fila para evitar carreras
   * sobre `balance`), validar la categoría, ajustar el saldo e insertar el
   * movimiento. Ante cualquier error se hace ROLLBACK y la cuenta no cambia.
   *
   * La "ejecución" de cada sobre no tiene columna propia en `categories`: se
   * deriva de la suma de sus egresos (ver `FinancesService.getSummary`), por lo
   * que queda consistente al confirmarse este mismo INSERT.
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const manager = runner.manager;

      const account = await manager.findOne(Account, {
        where: { id: dto.account_id, userId, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }

      let categoryId: string | null = null;
      if (dto.category_id !== undefined) {
        const category = await manager.findOne(Category, {
          where: { id: dto.category_id, userId },
        });
        if (!category) {
          throw new NotFoundException(NOT_FOUND_MESSAGE);
        }
        categoryId = category.id;
      }

      if (dto.type === TransactionType.EXPENSE) {
        if (account.balance < dto.amount) {
          throw new BadRequestException(INSUFFICIENT_FUNDS_MESSAGE);
        }
        account.balance = round2(account.balance - dto.amount);
      } else {
        account.balance = round2(account.balance + dto.amount);
      }
      await manager.save(Account, account);

      const saved = await manager.save(
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

      await runner.commitTransaction();
      return TransactionResponseDto.fromEntity(saved);
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
