import { Column, Entity } from 'typeorm';
import { TimestampedEntity } from './base.entity';

/**
 * Mapea la tabla `users` definida en init.sql (raíz del repo).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 */
@Entity({ name: 'users' })
export class User extends TimestampedEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;
}
