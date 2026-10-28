import { Column, Entity } from 'typeorm';
import { OwnedEntity } from './base.entity';

export enum TimeBlockCategory {
  WORK = 'work',
  SLEEP = 'sleep',
  LEISURE = 'leisure',
  EXERCISE = 'exercise',
  OTHER = 'other',
}

/**
 * Mapea la tabla `time_blocks` (Cronograma diario, Issue #23).
 * No debe alterar el esquema: `synchronize` está deshabilitado.
 */
@Entity({ name: 'time_blocks' })
export class TimeBlock extends OwnedEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({ name: 'actual_duration_minutes', type: 'integer', default: 0 })
  actualDurationMinutes!: number;

  @Column({ type: 'varchar', length: 20, default: TimeBlockCategory.OTHER })
  category!: TimeBlockCategory;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId!: string | null;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted!: boolean;
}
