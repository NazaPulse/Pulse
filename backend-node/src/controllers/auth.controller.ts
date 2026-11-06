import { Body } from '@nestjs/common';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { AuthService } from '../services/auth.service';
import { AuthRoutes } from './routes/auth.routes';

/** Registro e inicio de sesión (rutas documentadas en {@link AuthRoutes}). */
@AuthRoutes.controller
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @AuthRoutes.register
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @AuthRoutes.login
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
