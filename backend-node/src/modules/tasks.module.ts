import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { Task } from '../models/task.entity';
import { TaskController, TasksController } from '../controllers/tasks.controller';
import { TasksService } from '../services/tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), AuthModule],
  controllers: [TasksController, TaskController],
  providers: [TasksService],
})
export class TasksModule {}
