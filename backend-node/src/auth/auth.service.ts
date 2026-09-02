import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserPublicDto } from './dto/user-public.dto';
import { HashingService } from './hashing/hashing.service';

const PG_UNIQUE_VIOLATION = '23505';
const EMAIL_TAKEN_MESSAGE = 'El email ya se encuentra registrado.';
const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';

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
    const email = dto.email.trim().toLowerCase();

    if (await this.users.existsByEmail(email)) {
      throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
    }

    const passwordHash = await this.hashing.hash(dto.password);

    let user: User;
    try {
      user = await this.users.create({
        email,
        passwordHash,
        fullName: dto.full_name ?? null,
      });
    } catch (err) {
      // Carrera entre el existsByEmail y el INSERT: la constraint UNIQUE gana.
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new BadRequestException(EMAIL_TAKEN_MESSAGE);
      }
      throw err;
    }

    return UserPublicDto.fromEntity(user);
  }

  /**
   * RF-02 — Login. `200` con { access_token } si las credenciales son válidas;
   * `401` con mensaje genérico en cualquier otro caso.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

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

    // Rehash transparente si los parámetros almacenados quedaron por debajo
    // de la política vigente (openapi.yaml · "rehash on login").
    if (this.hashing.needsRehash(user.passwordHash)) {
      try {
        const fresh = await this.hashing.hash(dto.password);
        await this.users.updatePasswordHash(user.id, fresh);
      } catch (err) {
        this.logger.warn(`No se pudo re-hashear al usuario ${user.id}: ${(err as Error).message}`);
      }
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);

    return { access_token: accessToken };
  }
}
