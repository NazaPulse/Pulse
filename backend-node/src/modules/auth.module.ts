import { Module } from '@nestjs/common';
import { jwtModule } from '../common/config/jwt.config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { hashingProvider } from '../services/hashing/hashing.provider';
import { UsersModule } from './users.module';

/** Módulo 0 — Autenticación (RF-01 / RF-02): JWT firmado y hashing Argon2id. */
@Module({
  imports: [UsersModule, jwtModule],
  controllers: [AuthController],
  providers: [AuthService, hashingProvider, JwtAuthGuard],
  // `JwtModule` y `JwtAuthGuard` se re-exportan para que los demás módulos puedan proteger sus
  // rutas con `@UseGuards(JwtAuthGuard)` importando únicamente `AuthModule`.
  exports: [AuthService, jwtModule, JwtAuthGuard],
})
export class AuthModule {}
