import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { LoginResponseDto } from '../../dto/auth/login-response.dto';
import { UserPublicDto } from '../../dto/auth/user-public.dto';

/**
 * Rutas de autenticación (públicas). El prefijo `api/auth` reproduce exactamente las rutas
 * `POST /api/auth/register` y `POST /api/auth/login` de openapi.yaml.
 */
export const AuthRoutes = {
  controller: applyDecorators(ApiTags('Auth'), Controller('api/auth')),
  /** RF-01 — Registro. `201 Created` con `UserPublic`; `400` si el email existe o el payload es inválido. */
  register: ApiRoute('post', 'register', {
    operationId: 'registerUser',
    summary: 'Registrar un nuevo usuario',
    returns: { status: 'created', type: UserPublicDto, description: 'Usuario creado correctamente.' },
    badRequest: 'Fallo de validación o email ya registrado.',
    unauthorized: false,
  }),
  /** RF-02 — Login. `200 OK` con `{ access_token }`; `401` con mensaje genérico si las credenciales fallan. */
  login: ApiRoute('post', 'login', {
    operationId: 'loginUser',
    summary: 'Autenticar un usuario y emitir un token de acceso',
    returns: {
      status: 'ok',
      type: LoginResponseDto,
      description: 'Autenticación correcta. Se retorna el token de acceso.',
    },
    badRequest: 'El payload no cumple el esquema requerido.',
    unauthorized: 'Credenciales inválidas.',
  }),
};
