import { Column, Entity } from 'typeorm';
import { OwnedEntity, MoneyColumn } from './base.entity';

/**
 * Mapea la tabla `categories` definida en init.sql (raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 *
 * `target_amount` (openapi.yaml) se persiste en la columna `monthly_limit`
 * (nombre histórico de la tabla, Issue #1); `icon` se agregó a init.sql en
 * la Issue #8 para poder cumplir el contrato publicado en la Issue #7.
 */
@Entity({ name: 'categories' })
export class Category extends OwnedEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @MoneyColumn('monthly_limit')
  targetAmount!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null;
}
