import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../models/account.entity';
import { Category } from '../models/category.entity';
import { Transaction, TransactionType } from '../models/transaction.entity';
import { CategorySummaryDto, FinancesSummaryDto } from '../dto/finances/finances-summary.dto';

interface TotalsRow {
  total_income: string | null;
  total_expenses: string | null;
}

interface CategoryRow {
  category_id: string;
  category_name: string;
  icon: string | null;
  color: string | null;
  total_amount: string;
}

/** Saldo total de las cuentas activas del usuario. */
async function totalBalance(accounts: Repository<Account>, userId: string): Promise<number> {
  const balanceRow = await accounts
    .createQueryBuilder('a')
    .select('COALESCE(SUM(a.balance), 0)', 'total_balance')
    .where('a.user_id = :userId', { userId })
    .andWhere('a.is_active = true')
    .getRawOne<{ total_balance: string }>();
  return toNumber(balanceRow?.total_balance);
}

function incomeAndExpenses(transactions: Repository<Transaction>, userId: string): Promise<TotalsRow | undefined> {
  return transactions
    .createQueryBuilder('t')
    .select(`COALESCE(SUM(t.amount) FILTER (WHERE t.type = :income), 0)`, 'total_income')
    .addSelect(`COALESCE(SUM(t.amount) FILTER (WHERE t.type = :expense), 0)`, 'total_expenses')
    .where('t.user_id = :userId', { userId })
    .setParameters({ income: TransactionType.INCOME, expense: TransactionType.EXPENSE })
    .getRawOne<TotalsRow>();
}

/** Solo egresos, agrupados por sobre y ordenados de mayor a menor. */
function expensesByCategory(transactions: Repository<Transaction>, userId: string): Promise<CategoryRow[]> {
  return transactions
    .createQueryBuilder('t')
    .innerJoin(Category, 'c', 'c.id = t.category_id AND c.user_id = t.user_id')
    .select('c.id', 'category_id')
    .addSelect('c.name', 'category_name')
    .addSelect('c.icon', 'icon')
    .addSelect('c.color', 'color')
    .addSelect('SUM(t.amount)', 'total_amount')
    .where('t.user_id = :userId', { userId })
    .andWhere('t.type = :expense', { expense: TransactionType.EXPENSE })
    .groupBy('c.id')
    .addGroupBy('c.name')
    .addGroupBy('c.icon')
    .addGroupBy('c.color')
    .orderBy('total_amount', 'DESC')
    .getRawMany<CategoryRow>();
}

/**
 * Métricas agregadas del usuario autenticado. Todas las consultas filtran por `user_id`;
 * `by_category` agrupa solo egresos y calcula el porcentaje sobre `total_expenses`.
 */
@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
  ) {}

  async getSummary(userId: string): Promise<FinancesSummaryDto> {
    const balance = await totalBalance(this.accounts, userId);
    const totals = await incomeAndExpenses(this.transactions, userId);
    const categoryRows = await expensesByCategory(this.transactions, userId);
    const totalExpenses = toNumber(totals?.total_expenses);

    return {
      total_balance: balance,
      total_income: toNumber(totals?.total_income),
      total_expenses: totalExpenses,
      by_category: categoryRows.map((row) => toCategorySummary(row, totalExpenses)),
    };
  }
}

// `color`/`icon` son nullable en init.sql; igual que `CategoryResponseDto`,
// se devuelven como '' para cumplir el contrato (string no-nulo).
function toCategorySummary(row: CategoryRow, totalExpenses: number): CategorySummaryDto {
  const totalAmount = toNumber(row.total_amount);
  return {
    category_id: row.category_id,
    category_name: row.category_name,
    icon: row.icon ?? '',
    color: row.color ?? '',
    total_amount: totalAmount,
    percentage: percentageOf(totalAmount, totalExpenses),
  };
}

function percentageOf(amount: number, total: number): number {
  return total > 0 ? round2((amount / total) * 100) : 0;
}

function toNumber(value: string | null | undefined): number {
  return value === null || value === undefined ? 0 : parseFloat(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
