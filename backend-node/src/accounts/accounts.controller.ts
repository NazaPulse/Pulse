import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

/**
 * Rutas de Cuentas financieras (Issue #8). Reproduce `/api/accounts` y
 * `/api/accounts/{id}` de openapi.yaml. Todas las rutas requieren JWT
 * (`bearerAuth`) y filtran obligatoriamente por el usuario autenticado.
 */
@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @ApiOperation({ operationId: 'listAccounts', summary: 'Listar las cuentas financieras del usuario autenticado' })
  @ApiOkResponse({ type: AccountResponseDto, isArray: true, description: 'Listado de cuentas del usuario.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<AccountResponseDto[]> {
    return this.accounts.findAllForUser(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createAccount', summary: 'Crear una nueva cuenta financiera' })
  @ApiCreatedResponse({ type: AccountResponseDto, description: 'Cuenta creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accounts.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getAccountById', summary: 'Obtener una cuenta financiera por id' })
  @ApiOkResponse({ type: AccountResponseDto, description: 'Cuenta encontrada.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AccountResponseDto> {
    return this.accounts.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ operationId: 'updateAccount', summary: 'Actualizar una cuenta financiera existente' })
  @ApiOkResponse({ type: AccountResponseDto, description: 'Cuenta actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accounts.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteAccount', summary: 'Eliminar una cuenta financiera' })
  @ApiNoContentResponse({ description: 'Cuenta eliminada correctamente. No retorna contenido.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.accounts.remove(user.id, id);
  }
}
