import { Body, Param } from '@nestjs/common';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateAccountDto } from '../dto/accounts/create-account.dto';
import { UpdateAccountDto } from '../dto/accounts/update-account.dto';
import { AccountsService } from '../services/accounts.service';
import { AccountsRoutes } from './routes/accounts.routes';

/** Cuentas financieras del usuario autenticado (rutas documentadas en {@link AccountsRoutes}). */
@AccountsRoutes.controller
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @AccountsRoutes.list
  list(@UserId() userId: string) {
    return this.accounts.findAllForUser(userId);
  }

  @AccountsRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateAccountDto) {
    return this.accounts.create(userId, dto);
  }

  @AccountsRoutes.findOne
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.accounts.findOneForUser(userId, id);
  }

  @AccountsRoutes.update
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(userId, id, dto);
  }

  @AccountsRoutes.remove
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.accounts.remove(userId, id);
  }
}
