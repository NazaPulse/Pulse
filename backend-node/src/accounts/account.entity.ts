import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NumericColumnTransformer } from '../common/numeric-column.transformer';

export enum AccountType {
  BANK = 'bank',
  WALLET = 'wallet',
  CASH = 'cash',
}

/**
 * Mapea la tabla `accounts` definida en init.sql (raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 */
@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: AccountType;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  })
  balance!: number;

  // Borrado lógico: DELETE /api/accounts/{id} marca is_active=false en lugar
  // de eliminar la fila (preserva integridad referencial con transacciones).
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
