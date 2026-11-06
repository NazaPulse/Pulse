import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { findOwnedOrFail } from '../common/owned-records';
import { Account } from '../models/account.entity';
import { AccountResponseDto } from '../dto/accounts/account-response.dto';
import { CreateAccountDto } from '../dto/accounts/create-account.dto';
import { UpdateAccountDto } from '../dto/accounts/update-account.dto';

const toResponse = (row: Account) => AccountResponseDto.fromEntity(row);
const active = { isActive: true };
const oldestFirst = { createdAt: 'ASC' } as const;

/** Cuentas del usuario. El borrado es lógico (`isActive = false`) y las inactivas no se ven. */
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
  ) {}

  async findAllForUser(userId: string) {
    const rows = await this.accounts.find({ where: { userId, ...active }, order: oldestFirst });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateAccountDto) {
    const entity = this.accounts.create({
      userId,
      name: dto.name,
      type: dto.type,
      balance: dto.initial_balance ?? 0,
    });
    return toResponse(await this.accounts.save(entity));
  }

  async findOneForUser(userId: string, id: string) {
    return toResponse(await findOwnedOrFail(this.accounts, userId, id, active));
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    const account = await findOwnedOrFail(this.accounts, userId, id, active);
    account.name = dto.name;
    account.type = dto.type;
    return toResponse(await this.accounts.save(account));
  }

  async remove(userId: string, id: string): Promise<void> {
    const account = await findOwnedOrFail(this.accounts, userId, id, active);
    account.isActive = false;
    await this.accounts.save(account);
  }
}
