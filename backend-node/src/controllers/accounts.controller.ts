import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { AccountResponseDto } from '../dto/accounts/account-response.dto';
import { CreateAccountDto } from '../dto/accounts/create-account.dto';
import { UpdateAccountDto } from '../dto/accounts/update-account.dto';
import { AccountsService } from '../services/accounts.service';

/**
 * Rutas de Cuentas financieras (Issue #8). Reproduce `/api/accounts` y
 * `/api/accounts/{id}` de openapi.yaml. Todas las rutas requieren JWT
 * (`bearerAuth`) y filtran obligatoriamente por el usuario autenticado.
 */
@ApiProtected('Accounts')
@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listAccounts',
    summary: 'Listar las cuentas financieras del usuario autenticado',
    returns: { status: 'ok', type: AccountResponseDto, isArray: true, description: 'Listado de cuentas del usuario.' },
  })
  list(@CurrentUser() user: AuthenticatedUser): Promise<AccountResponseDto[]> {
    return this.accounts.findAllForUser(user.id);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createAccount',
    summary: 'Crear una nueva cuenta financiera',
    returns: { status: 'created', type: AccountResponseDto, description: 'Cuenta creada correctamente.' },
    badRequest: true,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accounts.create(user.id, dto);
  }

  @Get(':id')
  @ApiEndpoint({
    operationId: 'getAccountById',
    summary: 'Obtener una cuenta financiera por id',
    returns: { status: 'ok', type: AccountResponseDto, description: 'Cuenta encontrada.' },
    notFound: true,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<AccountResponseDto> {
    return this.accounts.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiEndpoint({
    operationId: 'updateAccount',
    summary: 'Actualizar una cuenta financiera existente',
    returns: { status: 'ok', type: AccountResponseDto, description: 'Cuenta actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accounts.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiEndpoint({
    operationId: 'deleteAccount',
    summary: 'Eliminar una cuenta financiera',
    returns: { status: 'noContent', description: 'Cuenta eliminada correctamente. No retorna contenido.' },
    notFound: true,
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.accounts.remove(user.id, id);
  }
}
