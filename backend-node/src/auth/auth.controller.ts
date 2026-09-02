import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserPublicDto } from './dto/user-public.dto';

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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'registerUser', summary: 'Registrar un nuevo usuario' })
  @ApiCreatedResponse({ type: UserPublicDto, description: 'Usuario creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación o email ya registrado.' })
  register(@Body() dto: RegisterDto): Promise<UserPublicDto> {
    return this.auth.register(dto);
  }

  /** RF-02 — Login. `200 OK` con `{ access_token }`; `401` con mensaje genérico si las credenciales fallan. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'loginUser', summary: 'Autenticar un usuario y emitir un token de acceso' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Autenticación correcta. Se retorna el token de acceso.' })
  @ApiBadRequestResponse({ description: 'El payload no cumple el esquema requerido.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }
}
