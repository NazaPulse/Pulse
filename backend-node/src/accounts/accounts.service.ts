import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
  ) {}

  async findAllForUser(userId: string): Promise<AccountResponseDto[]> {
    const rows = await this.accounts.find({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => AccountResponseDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateAccountDto): Promise<AccountResponseDto> {
    const entity = this.accounts.create({
      userId,
      name: dto.name,
      type: dto.type,
      balance: dto.initial_balance ?? 0,
    });
    const saved = await this.accounts.save(entity);
    return AccountResponseDto.fromEntity(saved);
  }

  async findOneForUser(userId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.findOwnedOrFail(userId, id);
    return AccountResponseDto.fromEntity(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const account = await this.findOwnedOrFail(userId, id);
    account.name = dto.name;
    account.type = dto.type;
    const saved = await this.accounts.save(account);
    return AccountResponseDto.fromEntity(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const account = await this.findOwnedOrFail(userId, id);
    account.isActive = false;
    await this.accounts.save(account);
  }

  /**
   * Aislamiento por usuario: cualquier operación por `id` filtra siempre por
   * `userId`. Un `id` de otro usuario (o inexistente, o con formato inválido)
   * responde `404` — nunca revela si el recurso existe para otro usuario.
   */
  private async findOwnedOrFail(userId: string, id: string): Promise<Account> {
    if (!isUUID(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const account = await this.accounts.findOne({
      where: { id, userId, isActive: true },
    });

    if (!account) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return account;
  }
}
