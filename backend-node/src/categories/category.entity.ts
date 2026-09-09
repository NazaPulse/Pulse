import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NumericColumnTransformer } from '../common/numeric-column.transformer';

/**
 * Mapea la tabla `categories` definida en init.sql (raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 *
 * `target_amount` (openapi.yaml) se persiste en la columna `monthly_limit`
 * (nombre histórico de la tabla, Issue #1); `icon` se agregó a init.sql en
 * la Issue #8 para poder cumplir el contrato publicado en la Issue #7.
 */
@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'monthly_limit',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  })
  targetAmount!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
