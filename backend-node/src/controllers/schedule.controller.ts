import { Body, Param, Query } from '@nestjs/common';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateTimeBlockDto } from '../dto/schedule/create-time-block.dto';
import { ListScheduleQueryDto } from '../dto/schedule/list-schedule-query.dto';
import { UpdateTimeBlockDto } from '../dto/schedule/update-time-block.dto';
import { ScheduleService } from '../services/schedule.service';
import { ScheduleRoutes } from './routes/schedule.routes';

/** Bloques de tiempo del usuario autenticado: listado y alta (ver {@link ScheduleRoutes}). */
@ScheduleRoutes.controller
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @ScheduleRoutes.list
  list(@UserId() userId: string, @Query() query: ListScheduleQueryDto) {
    return this.schedule.findAllForUser(userId, query);
  }

  @ScheduleRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateTimeBlockDto) {
    return this.schedule.create(userId, dto);
  }
}

/** Un bloque de tiempo por `id`: edición parcial y baja (ver {@link ScheduleRoutes}). */
@ScheduleRoutes.controller
export class TimeBlockController {
  constructor(private readonly schedule: ScheduleService) {}

  @ScheduleRoutes.update
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateTimeBlockDto) {
    return this.schedule.update(userId, id, dto);
  }

  @ScheduleRoutes.remove
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.schedule.remove(userId, id);
  }
}

export const SCHEDULE_CONTROLLERS = [ScheduleController, TimeBlockController];
