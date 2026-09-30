import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../accounts/account.entity';
import { Category } from '../categories/category.entity';
import { NumericColumnTransformer } from '../common/numeric-column.transformer';

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
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

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

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  })
  amount!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
