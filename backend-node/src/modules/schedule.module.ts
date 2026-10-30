import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { Task } from '../models/task.entity';
import { TimeBlock } from '../models/time-block.entity';
import { ScheduleController, TimeBlockController } from '../controllers/schedule.controller';
import { ScheduleService } from '../services/schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeBlock, Task]), AuthModule],
  controllers: [ScheduleController, TimeBlockController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
