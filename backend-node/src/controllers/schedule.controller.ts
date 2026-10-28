import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { CreateTimeBlockDto } from '../dto/schedule/create-time-block.dto';
import { ListScheduleQueryDto } from '../dto/schedule/list-schedule-query.dto';
import { TimeBlockResponseDto } from '../dto/schedule/time-block-response.dto';
import { UpdateTimeBlockDto } from '../dto/schedule/update-time-block.dto';
import { ScheduleService } from '../services/schedule.service';

/**
 * Rutas del Cronograma diario (Issue #23). Reproduce `/api/schedule` y
 * `/api/schedule/{id}` de openapi.yaml. Todas las rutas requieren JWT y
 * filtran por el usuario autenticado.
 */
@ApiProtected('Schedule')
@Controller('api/schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listTimeBlocks',
    summary: 'Listar los bloques de tiempo del usuario autenticado',
    returns: {
      status: 'ok',
      type: TimeBlockResponseDto,
      isArray: true,
      description: 'Listado de bloques de tiempo del usuario autenticado.',
    },
    badRequest: 'Fallo de validación de los filtros.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListScheduleQueryDto,
  ): Promise<TimeBlockResponseDto[]> {
    return this.schedule.findAllForUser(user.id, query);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createTimeBlock',
    summary: 'Agendar un nuevo bloque de tiempo',
    returns: { status: 'created', type: TimeBlockResponseDto, description: 'Bloque de tiempo creado correctamente.' },
    badRequest: true,
    notFound: true,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTimeBlockDto): Promise<TimeBlockResponseDto> {
    return this.schedule.create(user.id, dto);
  }

  @Patch(':id')
  @ApiEndpoint({
    operationId: 'updateTimeBlock',
    summary: 'Actualizar parcialmente un bloque de tiempo',
    returns: { status: 'ok', type: TimeBlockResponseDto, description: 'Bloque de tiempo actualizado correctamente.' },
    badRequest: true,
    notFound: true,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimeBlockDto,
  ): Promise<TimeBlockResponseDto> {
    return this.schedule.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiEndpoint({
    operationId: 'deleteTimeBlock',
    summary: 'Eliminar un bloque de tiempo',
    returns: { status: 'noContent', description: 'Bloque eliminado correctamente. No retorna contenido.' },
    notFound: true,
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.schedule.remove(user.id, id);
  }
}
