import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SCHEDULE_CONTROLLERS } from '../controllers/schedule.controller';
import { Task } from '../models/task.entity';
import { TimeBlock } from '../models/time-block.entity';
import { ScheduleService } from '../services/schedule.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimeBlock, Task]), AuthModule],
  controllers: SCHEDULE_CONTROLLERS,
  providers: [ScheduleService],
})
export class ScheduleModule {}
