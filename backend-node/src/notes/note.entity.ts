import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Mapea la tabla `notes` (Módulo de Productividad, Issue #18).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 */
@Entity({ name: 'notes' })
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'audio_url', type: 'varchar', length: 2048, nullable: true })
  audioUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
