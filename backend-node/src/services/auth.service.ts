import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { User } from '../models/user.entity';
import { UsersService } from './users.service';
import { LoginDto } from '../dto/auth/login.dto';
import { LoginResponseDto } from '../dto/auth/login-response.dto';
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
  return (
    err instanceof QueryFailedError &&
    (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * RF-01 — Registro. Hashea con Argon2id y persiste. `201` en éxito;
   * `400` si el email ya existe o el payload es inválido (validación en el pipe).
   */
  async register(dto: RegisterDto): Promise<UserPublicDto> {
    const email = normalizeEmail(dto.email);
    if (await this.users.existsByEmail(email)) {
      throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
    }

    const passwordHash = await this.hashing.hash(dto.password);
    const user = await this.createUser(email, passwordHash, dto.full_name ?? null);
    return UserPublicDto.fromEntity(user);
  }

  /**
   * RF-02 — Login. `200` con { access_token } si las credenciales son válidas;
   * `401` con mensaje genérico en cualquier otro caso.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authenticate(dto);
    await this.rehashIfNeeded(user, dto.password);

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);
    return { access_token: accessToken };
  }

  private async createUser(email: string, passwordHash: string, fullName: string | null): Promise<User> {
    try {
      return await this.users.create({ email, passwordHash, fullName });
    } catch (err) {
      // Carrera entre el existsByEmail y el INSERT: la constraint UNIQUE gana.
      if (isUniqueViolation(err)) {
        throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
      }
      throw err;
    }
  }

  private async authenticate(dto: LoginDto): Promise<User> {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    if (!user) {
      // Igual coste aproximado que una verificación real para no filtrar
      // por tiempo si el email existe o no.
      await this.hashing.hash(dto.password).catch(() => undefined);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const ok = await this.hashing.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    return user;
  }

  /**
   * Rehash transparente si los parámetros almacenados quedaron por debajo
   * de la política vigente (openapi.yaml · "rehash on login").
   */
  private async rehashIfNeeded(user: User, password: string): Promise<void> {
    if (!this.hashing.needsRehash(user.passwordHash)) return;
    try {
      const fresh = await this.hashing.hash(password);
      await this.users.updatePasswordHash(user.id, fresh);
    } catch (err) {
      this.logger.warn(`No se pudo re-hashear al usuario ${user.id}: ${(err as Error).message}`);
    }
  }
}
