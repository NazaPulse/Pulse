import { Column, Entity } from 'typeorm';
import { OwnedEntity, MoneyColumn } from './base.entity';

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
export class Account extends OwnedEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: AccountType;

  @MoneyColumn()
  balance!: number;

  // Borrado lógico: DELETE /api/accounts/{id} marca is_active=false en lugar
  // de eliminar la fila (preserva integridad referencial con transacciones).
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
