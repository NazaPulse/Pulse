import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

/**
 * Contrato openapi.yaml:
 *  - list/get/put/delete filtran siempre por `userId` -> 404 si el recurso
 *    es de otro usuario, no existe, o el `id` no es un UUID válido.
 *  - `color`/`icon` son opcionales en el alta pero requeridos y no-nulos en
 *    la respuesta `Category`: se completan con un valor por defecto.
 */
describe('CategoriesService', () => {
  const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';
  const OTHER_USER_ID = '9a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9';
  const CATEGORY_ID = '3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b';

  const buildCategory = (over: Partial<Category> = {}): Category =>
    Object.assign(new Category(), {
      id: CATEGORY_ID,
      userId: OWNER_ID,
      name: 'Supermercado',
      targetAmount: 500,
      color: '#FF5733',
      icon: 'shopping-cart',
      createdAt: new Date('2026-08-28T14:06:00.000Z'),
      updatedAt: new Date('2026-08-28T14:06:00.000Z'),
      ...over,
    });

  let repo: jest.Mocked<Pick<Repository<Category>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
  let service: CategoriesService;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new CategoriesService(repo as unknown as Repository<Category>);
  });

  describe('create', () => {
    it('persiste color/icon enviados por el cliente', async () => {
      repo.create.mockReturnValue(buildCategory() as never);
      repo.save.mockResolvedValue(buildCategory());

      await service.create(OWNER_ID, {
        name: 'Supermercado',
        target_amount: 500,
        color: '#FF5733',
        icon: 'shopping-cart',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#FF5733', icon: 'shopping-cart' }),
      );
    });

    it('aplica color/icon por defecto si el cliente no los envía', async () => {
      repo.create.mockReturnValue(buildCategory() as never);
      repo.save.mockResolvedValue(buildCategory());

      await service.create(OWNER_ID, { name: 'Transporte', target_amount: 150 });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: expect.any(String), icon: expect.any(String) }),
      );
    });
  });

  describe('aislamiento por usuario', () => {
    it('findOneForUser lanza 404 si el sobre pertenece a otro usuario', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser(OTHER_USER_ID, CATEGORY_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: CATEGORY_ID, userId: OTHER_USER_ID } });
    });

    it('findOneForUser lanza 404 sin tocar la DB si el id no es un UUID válido', async () => {
      await expect(service.findOneForUser(OWNER_ID, 'no-es-un-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('remove lanza 404 si el sobre no pertenece al usuario y no elimina nada', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(OTHER_USER_ID, CATEGORY_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('remove elimina el sobre cuando pertenece al usuario', async () => {
      const category = buildCategory();
      repo.findOne.mockResolvedValue(category);

      await service.remove(OWNER_ID, CATEGORY_ID);

      expect(repo.remove).toHaveBeenCalledWith(category);
    });
  });
});
