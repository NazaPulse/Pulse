import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Account, AccountType } from './account.entity';
import { AccountsService } from './accounts.service';

/**
 * Contrato openapi.yaml:
 *  - list/get/put/delete filtran siempre por `userId` -> 404 si el recurso
 *    es de otro usuario, no existe, o el `id` no es un UUID válido.
 *  - create: `balance` inicial = `initial_balance` (default 0).
 *  - update: solo `name`/`type`; `balance` nunca se edita manualmente.
 *  - delete: borrado lógico (`is_active = false`), no elimina la fila.
 */
describe('AccountsService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const OTHER_USER_ID = '9a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9';
  const ACCOUNT_ID = '7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f';

  const buildAccount = (over: Partial<Account> = {}): Account =>
    Object.assign(new Account(), {
      id: ACCOUNT_ID,
      userId: OWNER_ID,
      name: 'Cuenta Corriente Santander',
      type: AccountType.BANK,
      balance: 15230.5,
      isActive: true,
      createdAt: new Date('2026-08-28T14:03:21.000Z'),
      updatedAt: new Date('2026-08-28T14:03:21.000Z'),
      ...over,
    });

  let repo: jest.Mocked<Pick<Repository<Account>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
  let service: AccountsService;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new AccountsService(repo as unknown as Repository<Account>);
  });

  describe('findAllForUser', () => {
    it('filtra por userId y solo devuelve cuentas activas', async () => {
      repo.find.mockResolvedValue([buildAccount()]);

      const result = await service.findAllForUser(OWNER_ID);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: OWNER_ID, isActive: true } }),
      );
      expect(result).toEqual([
        {
          id: ACCOUNT_ID,
          name: 'Cuenta Corriente Santander',
          type: AccountType.BANK,
          balance: 15230.5,
          created_at: '2026-08-28T14:03:21.000Z',
          updated_at: '2026-08-28T14:03:21.000Z',
        },
      ]);
    });
  });

  describe('create', () => {
    it('usa initial_balance como balance de arranque', async () => {
      repo.create.mockReturnValue(buildAccount() as never);
      repo.save.mockResolvedValue(buildAccount());

      await service.create(OWNER_ID, {
        name: 'Cuenta Corriente Santander',
        type: AccountType.BANK,
        initial_balance: 15230.5,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER_ID, balance: 15230.5 }),
      );
    });

    it('default balance a 0 si no se envía initial_balance', async () => {
      repo.create.mockReturnValue(buildAccount({ balance: 0 }) as never);
      repo.save.mockResolvedValue(buildAccount({ balance: 0 }));

      await service.create(OWNER_ID, { name: 'Efectivo', type: AccountType.CASH });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ balance: 0 }));
    });
  });

  describe('aislamiento por usuario', () => {
    it('findOneForUser lanza 404 si la cuenta pertenece a otro usuario', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser(OTHER_USER_ID, ACCOUNT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: OTHER_USER_ID, isActive: true },
      });
    });

    it('findOneForUser lanza 404 sin tocar la DB si el id no es un UUID válido', async () => {
      await expect(service.findOneForUser(OWNER_ID, 'no-es-un-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('update lanza 404 si la cuenta no pertenece al usuario', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update(OTHER_USER_ID, ACCOUNT_ID, { name: 'x', type: AccountType.CASH }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('remove hace borrado lógico (is_active=false) sin eliminar la fila', async () => {
      const account = buildAccount();
      repo.findOne.mockResolvedValue(account);
      repo.save.mockResolvedValue({ ...account, isActive: false });

      await service.remove(OWNER_ID, ACCOUNT_ID);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
