import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Argon2HashingService } from './hashing/argon2-hashing.service';
import { HashingService } from './hashing/hashing.service';

/**
 * Módulo 0 — Autenticación (RF-01 / RF-02).
 *
 * - `HashingService` se resuelve SIEMPRE a {@link Argon2HashingService}
 *   (Argon2id, perfil OWASP de openapi.yaml). Prohibido bcrypt.
 * - `JwtModule` firma con `JWT_SECRET` y expira según `JWT_EXPIRES_IN` (.env).
 */
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // `expiresIn` acepta segundos (number) o un lapso estilo `ms` ("3600s").
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '3600s') as `${number}s`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: HashingService, useClass: Argon2HashingService },
    JwtAuthGuard,
  ],
  // `JwtModule` y `JwtAuthGuard` se re-exportan para que los módulos de
  // Finanzas (Accounts, Categories) puedan proteger sus rutas con
  // `@UseGuards(JwtAuthGuard)` importando únicamente `AuthModule`.
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
