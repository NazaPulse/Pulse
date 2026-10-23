import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { LoginDto } from '../dto/auth/login.dto';
import { LoginResponseDto } from '../dto/auth/login-response.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { UserPublicDto } from '../dto/auth/user-public.dto';
import { AuthService } from '../services/auth.service';

/**
 * Rutas de autenticación. El prefijo `api/auth` reproduce exactamente las rutas
 * `POST /api/auth/register` y `POST /api/auth/login` de openapi.yaml.
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** RF-01 — Registro. `201 Created` con `UserPublic`; `400` si el email existe o el payload es inválido. */
  @Post('register')
  @ApiEndpoint({
    operationId: 'registerUser',
    summary: 'Registrar un nuevo usuario',
    returns: { status: 'created', type: UserPublicDto, description: 'Usuario creado correctamente.' },
    badRequest: 'Fallo de validación o email ya registrado.',
    unauthorized: false,
  })
  register(@Body() dto: RegisterDto): Promise<UserPublicDto> {
    return this.auth.register(dto);
  }

  /** RF-02 — Login. `200 OK` con `{ access_token }`; `401` con mensaje genérico si las credenciales fallan. */
  @Post('login')
  @ApiEndpoint({
    operationId: 'loginUser',
    summary: 'Autenticar un usuario y emitir un token de acceso',
    returns: {
      status: 'ok',
      type: LoginResponseDto,
      description: 'Autenticación correcta. Se retorna el token de acceso.',
    },
    badRequest: 'El payload no cumple el esquema requerido.',
    unauthorized: 'Credenciales inválidas.',
  })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }
}
