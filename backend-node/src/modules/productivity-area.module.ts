import { Module } from '@nestjs/common';
import { NotesModule } from './notes.module';
import { ScheduleModule } from './schedule.module';
import { TasksModule } from './tasks.module';

/** Agrupa los módulos de Productividad. */
@Module({ imports: [TasksModule, NotesModule, ScheduleModule] })
export class ProductivityAreaModule {}
