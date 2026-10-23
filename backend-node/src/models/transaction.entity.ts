import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { OwnedEntity, MoneyColumn } from './base.entity';
import { Account } from './account.entity';
import { Category } from './category.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/**
 * Mapea la tabla `transactions` (init.sql, raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 *
 * `amount` es siempre positivo; el signo del impacto sobre la cuenta lo
 * determina `type`.
 */
@Entity({ name: 'transactions' })
export class Transaction extends OwnedEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @MoneyColumn()
  amount!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;
}
