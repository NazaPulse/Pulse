import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { User } from '../models/user.entity';
import { UsersService } from './users.service';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { UserPublicDto } from '../dto/auth/user-public.dto';
import { HashingService } from './hashing/hashing.service';

const PG_UNIQUE_VIOLATION = '23505';
const EMAIL_TAKEN_MESSAGE = 'El email ya se encuentra registrado.';
const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof QueryFailedError && (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION;
}

interface JwtPayload {
  sub: string;
  email: string;
}

/** `400` si el email ya está registrado. */
async function assertEmailAvailable(users: UsersService, email: string): Promise<void> {
  if (await users.existsByEmail(email)) {
    throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
  }
}

async function createUser(users: UsersService, data: Pick<User, 'email' | 'passwordHash' | 'fullName'>): Promise<User> {
  try {
    return await users.create(data);
  } catch (err) {
    // Carrera entre el existsByEmail y el INSERT: la constraint UNIQUE gana.
    if (isUniqueViolation(err)) {
      throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
    }
    throw err;
  }
}

/** Usuario con esas credenciales; `401` con mensaje genérico en cualquier otro caso. */
async function authenticate(users: UsersService, hashing: HashingService, dto: LoginDto): Promise<User> {
  const user = await users.findByEmail(normalizeEmail(dto.email));
  if (!user) {
    // Igual coste aproximado que una verificación real para no filtrar
    // por tiempo si el email existe o no.
    await hashing.hash(dto.password).catch(() => undefined);
    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
  }

  const ok = await hashing.verify(user.passwordHash, dto.password);
  if (!ok) {
    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
  }
  return user;
}

const rehashWarning = (userId: string, err: unknown) =>
  `No se pudo re-hashear al usuario ${userId}: ${(err as Error).message}`;

const tokenPayload = (user: User): JwtPayload => ({ sub: user.id, email: user.email });

/**
 * Registro e inicio de sesión.
 *
 * - RF-01 — Registro: hashea con Argon2id y persiste. `201` en éxito; `400` si el email ya
 *   existe o el payload es inválido (validación en el pipe).
 * - RF-02 — Login: `200` con `{ access_token }` si las credenciales son válidas; `401` con
 *   mensaje genérico en cualquier otro caso. Si los parámetros del hash almacenado quedaron por
 *   debajo de la política vigente se re-hashea de forma transparente (openapi.yaml · "rehash on
 *   login").
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    await assertEmailAvailable(this.users, email);

    const passwordHash = await this.hashing.hash(dto.password);
    const user = await createUser(this.users, { email, passwordHash, fullName: dto.full_name ?? null });
    return UserPublicDto.fromEntity(user);
  }

  async login(dto: LoginDto) {
    const user = await authenticate(this.users, this.hashing, dto);
    await this.rehashIfNeeded(user.id, user.passwordHash, dto.password);
    return { access_token: await this.jwt.signAsync(tokenPayload(user)) };
  }

  private async rehashIfNeeded(userId: string, storedHash: string, password: string): Promise<void> {
    if (!this.hashing.needsRehash(storedHash)) return;
    try {
      const fresh = await this.hashing.hash(password);
      await this.users.updatePasswordHash(userId, fresh);
    } catch (err) {
      this.logger.warn(rehashWarning(userId, err));
    }
  }
}
