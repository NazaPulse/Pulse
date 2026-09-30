import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { Category } from '../categories/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionType } from './transaction.entity';
import { INSUFFICIENT_FUNDS_MESSAGE, TransactionsService } from './transactions.service';

/**
 * Issue #13 — lógica de doble impacto:
 *  - Todo `create` corre dentro de un QueryRunner: commit si todo sale bien,
 *    ROLLBACK (sin tocar la cuenta) ante cualquier error.
 *  - expense: exige saldo suficiente (400) y categoría propia (404).
 *  - income: suma el monto al saldo.
 *  - Cuenta/categoría de otro usuario o inexistente -> 404.
 */
describe('TransactionsService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const ACCOUNT_ID = '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f';
  const CATEGORY_ID = '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b';
  const NOW = new Date('2026-09-02T18:31:00.000Z');

  const buildAccount = (balance: number): Account =>
    Object.assign(new Account(), {
      id: ACCOUNT_ID,
      userId: OWNER_ID,
      name: 'Cuenta',
      type: AccountType.BANK,
      balance,
      isActive: true,
    });

  const category = Object.assign(new Category(), { id: CATEGORY_ID, userId: OWNER_ID });

  const expenseDto: CreateTransactionDto = {
    amount: 120.75,
    type: TransactionType.EXPENSE,
    account_id: ACCOUNT_ID,
    category_id: CATEGORY_ID,
    date: '2026-09-02T18:30:00.000Z',
    description: 'Compra semanal',
  };

  let manager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let runner: {
    manager: typeof manager;
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
  };
  let service: TransactionsService;

  beforeEach(() => {
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_entity: unknown, data: Partial<Transaction>) => Object.assign(new Transaction(), data)),
      save: jest.fn((_entity: unknown, data: Account | Transaction) =>
        Promise.resolve(
          data instanceof Transaction
            ? Object.assign(data, { id: '9a8b7c6d-5e4f-4a3b-9c2d-1e0f2a3b4c5d', createdAt: NOW, updatedAt: NOW })
            : data,
        ),
      ),
    };
    runner = {
      manager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const dataSource = { createQueryRunner: () => runner } as unknown as DataSource;
    service = new TransactionsService(dataSource, {} as Repository<Transaction>);
  });

  const mockLookups = (account: Account | null, cat: Category | null = category) => {
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === Account ? account : cat),
    );
  };

  it('expense: descuenta el saldo, inserta y confirma la transacción', async () => {
    const account = buildAccount(500);
    mockLookups(account);

    const result = await service.create(OWNER_ID, expenseDto);

    expect(account.balance).toBe(379.25);
    expect(manager.save).toHaveBeenCalledWith(Account, account);
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        amount: 120.75,
        type: 'expense',
        account_id: ACCOUNT_ID,
        category_id: CATEGORY_ID,
        date: '2026-09-02T18:30:00.000Z',
      }),
    );
  });

  it('expense: filtra la cuenta por usuario activo con lock de escritura', async () => {
    mockLookups(buildAccount(500));

    await service.create(OWNER_ID, expenseDto);

    expect(manager.findOne).toHaveBeenCalledWith(Account, {
      where: { id: ACCOUNT_ID, userId: OWNER_ID, isActive: true },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.findOne).toHaveBeenCalledWith(Category, {
      where: { id: CATEGORY_ID, userId: OWNER_ID },
    });
  });

  it('expense: saldo insuficiente -> 400 y ROLLBACK sin modificar la cuenta', async () => {
    const account = buildAccount(100);
    mockLookups(account);

    await expect(service.create(OWNER_ID, expenseDto)).rejects.toThrow(
      new BadRequestException(INSUFFICIENT_FUNDS_MESSAGE),
    );
    expect(account.balance).toBe(100);
    expect(manager.save).not.toHaveBeenCalled();
    expect(runner.rollbackTransaction).toHaveBeenCalled();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('categoría inexistente o de otro usuario -> 404 y ROLLBACK', async () => {
    const account = buildAccount(500);
    mockLookups(account, null);

    await expect(service.create(OWNER_ID, expenseDto)).rejects.toBeInstanceOf(NotFoundException);
    expect(account.balance).toBe(500);
    expect(manager.save).not.toHaveBeenCalled();
    expect(runner.rollbackTransaction).toHaveBeenCalled();
  });

  it('cuenta inexistente o de otro usuario -> 404 y ROLLBACK', async () => {
    mockLookups(null);

    await expect(service.create(OWNER_ID, expenseDto)).rejects.toBeInstanceOf(NotFoundException);
    expect(runner.rollbackTransaction).toHaveBeenCalled();
  });

  it('falla al insertar el movimiento -> ROLLBACK', async () => {
    mockLookups(buildAccount(500));
    manager.save.mockImplementation((entity: unknown) =>
      entity === Transaction ? Promise.reject(new Error('db down')) : Promise.resolve(),
    );

    await expect(service.create(OWNER_ID, expenseDto)).rejects.toThrow('db down');
    expect(runner.rollbackTransaction).toHaveBeenCalled();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });

  it('income sin categoría: suma el monto al saldo y guarda category_id null', async () => {
    const account = buildAccount(100);
    mockLookups(account);

    const result = await service.create(OWNER_ID, {
      amount: 3500,
      type: TransactionType.INCOME,
      account_id: ACCOUNT_ID,
      date: '2026-09-01T12:00:00.000Z',
    });

    expect(account.balance).toBe(3600);
    expect(result.category_id).toBeNull();
    expect(result.description).toBeNull();
    expect(manager.findOne).not.toHaveBeenCalledWith(Category, expect.anything());
    expect(runner.commitTransaction).toHaveBeenCalled();
  });
});
