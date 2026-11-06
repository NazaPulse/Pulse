import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Field } from '../common/decorators/field.decorator';
import { OwnedEntity, MoneyColumn } from './base.entity';
import { Account } from './account.entity';
import { Category } from './category.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/** Columnas y relaciones de la tabla. */
const columns = {
  accountId: Column({ name: 'account_id', type: 'uuid' }),
  account: Field(
    ManyToOne(() => Account, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'account_id' }),
  ),
  categoryId: Column({ name: 'category_id', type: 'uuid', nullable: true }),
  category: Field(
    ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' }),
    JoinColumn({ name: 'category_id' }),
  ),
  amount: MoneyColumn(),
  type: Column({ type: 'varchar', length: 20 }),
  date: Column({ type: 'timestamptz' }),
  description: Column({ type: 'varchar', length: 255, nullable: true }),
};

/**
 * Mapea la tabla `transactions` (init.sql, raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 *
 * `amount` es siempre positivo; el signo del impacto sobre la cuenta lo
 * determina `type`.
 */
@Entity({ name: 'transactions' })
export class Transaction extends OwnedEntity {
  @columns.accountId
  accountId!: string;

  @columns.account
  account?: Account;

  @columns.categoryId
  categoryId!: string | null;

  @columns.category
  category?: Category | null;

  @columns.amount
  amount!: number;

  @columns.type
  type!: TransactionType;

  @columns.date
  date!: Date;

  @columns.description
  description!: string | null;
}
