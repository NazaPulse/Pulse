import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { HashingService } from './hashing/hashing.service';

/**
 * Contrato openapi.yaml:
 *  - register: 201 UserPublic · 400 si el email ya existe
 *  - login:    200 { access_token } · 401 genérico si las credenciales fallan
 */
describe('AuthService', () => {
  const buildUser = (over: Partial<User> = {}): User =>
    Object.assign(new User(), {
      id: '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071',
      email: 'usuario@pulse.app',
      passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$abc$def',
      fullName: 'Ada Lovelace',
      createdAt: new Date('2026-08-28T14:03:21.000Z'),
      updatedAt: new Date('2026-08-28T14:03:21.000Z'),
      ...over,
    });

  let users: jest.Mocked<Pick<UsersService, 'existsByEmail' | 'findByEmail' | 'create' | 'updatePasswordHash'>>;
  let hashing: jest.Mocked<HashingService>;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      existsByEmail: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    hashing = {
      hash: jest.fn(),
      verify: jest.fn(),
      needsRehash: jest.fn().mockReturnValue(false),
    };
    jwt = { signAsync: jest.fn() };
    service = new AuthService(
      users as unknown as UsersService,
      hashing as unknown as HashingService,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('hashea con Argon2id y devuelve UserPublic sin exponer el hash', async () => {
      users.existsByEmail.mockResolvedValue(false);
      hashing.hash.mockResolvedValue('$argon2id$v=19$m=19456,t=2,p=1$abc$def');
      users.create.mockResolvedValue(buildUser());

      const result = await service.register({
        email: 'Usuario@Pulse.app',
        password: 'S3gura-y-larga_2026!',
        full_name: 'Ada Lovelace',
      });

      expect(hashing.hash).toHaveBeenCalledWith('S3gura-y-larga_2026!');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'usuario@pulse.app' }),
      );
      expect(result).toEqual({
        id: '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071',
        email: 'usuario@pulse.app',
        full_name: 'Ada Lovelace',
        created_at: '2026-08-28T14:03:21.000Z',
        updated_at: '2026-08-28T14:03:21.000Z',
      });
      expect(result).not.toHaveProperty('password_hash');
    });

    it('lanza 400 BadRequest si el email ya está registrado', async () => {
      users.existsByEmail.mockResolvedValue(true);

      await expect(
        service.register({ email: 'usuario@pulse.app', password: 'S3gura-y-larga_2026!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('devuelve { access_token } con credenciales válidas', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      hashing.verify.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('signed.jwt.token');

      const result = await service.login({
        email: 'usuario@pulse.app',
        password: 'S3gura-y-larga_2026!',
      });

      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });

    it('lanza 401 Unauthorized si el email no existe', async () => {
      users.findByEmail.mockResolvedValue(null);
      hashing.hash.mockResolvedValue('irrelevante');

      await expect(
        service.login({ email: 'nadie@pulse.app', password: 'x'.repeat(12) }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza 401 Unauthorized si la contraseña no coincide', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      hashing.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: 'usuario@pulse.app', password: 'incorrecta-123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });
});
