import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NumericColumnTransformer } from '../common/numeric-column.transformer';

/** Columnas comunes de todas las tablas (init.sql): `id` UUID y marcas de creación/edición. */
export abstract class TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/** Registro que pertenece a un usuario (`user_id`): toda consulta debe filtrar por él. */
export abstract class OwnedEntity extends TimestampedEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;
}

/** Monto monetario `NUMERIC(14,2)` que se lee como `number` (por defecto, columna con el nombre del campo). */
export function MoneyColumn(columnName?: string): PropertyDecorator {
  return Column({
    ...(columnName ? { name: columnName } : {}),
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: new NumericColumnTransformer(),
  });
}
