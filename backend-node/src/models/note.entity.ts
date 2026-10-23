import { Column, Entity } from 'typeorm';
import { OwnedEntity } from './base.entity';

/**
 * Mapea la tabla `notes` (Módulo de Productividad, Issue #18).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 */
@Entity({ name: 'notes' })
export class Note extends OwnedEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'audio_url', type: 'varchar', length: 2048, nullable: true })
  audioUrl!: string | null;
}
