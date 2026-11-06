import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import type { Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const UNAUTHORIZED_MESSAGE = 'No se proporcionó un token válido o el token expiró.';
export const NOT_FOUND_MESSAGE = 'El recurso solicitado no existe o no pertenece al usuario autenticado.';
export const INVALID_PAYLOAD_MESSAGE = 'Fallo de validación de campos del payload.';

type SuccessKind = 'ok' | 'created' | 'noContent';

const SUCCESS: Record<SuccessKind, { status: HttpStatus; response: typeof ApiOkResponse }> = {
  ok: { status: HttpStatus.OK, response: ApiOkResponse },
  created: { status: HttpStatus.CREATED, response: ApiCreatedResponse },
  noContent: { status: HttpStatus.NO_CONTENT, response: ApiNoContentResponse },
};

export interface ApiEndpointOptions {
  operationId: string;
  summary: string;
  /** Respuesta exitosa: estado HTTP, tipo devuelto (opcional) y descripción. */
  returns: { status: SuccessKind; type?: Type<unknown>; isArray?: boolean; description: string };
  /** Descripción de la respuesta 400. `true` usa la de validación de payload estándar. */
  badRequest?: string | true;
  /** Descripción de la respuesta 404. `true` usa la estándar de recursos del usuario. */
  notFound?: string | true;
  /** Descripción de la respuesta 401; `false` la omite (rutas públicas). Por defecto, token ausente/vencido. */
  unauthorized?: string | false;
}

const messageOr = (value: string | true | undefined, standard: string) => (value === true ? standard : value);

/** Documenta una ruta (operación y respuestas de Swagger) y fija su código HTTP de éxito. */
export function ApiEndpoint(options: ApiEndpointOptions) {
  const { returns } = options;
  const success = SUCCESS[returns.status];
  const badRequest = messageOr(options.badRequest, INVALID_PAYLOAD_MESSAGE);
  const notFound = messageOr(options.notFound, NOT_FOUND_MESSAGE);
  const unauthorized = options.unauthorized === undefined ? UNAUTHORIZED_MESSAGE : options.unauthorized;

  return applyDecorators(
    HttpCode(success.status),
    ApiOperation({ operationId: options.operationId, summary: options.summary }),
    success.response({ type: returns.type, isArray: returns.isArray, description: returns.description }),
    ...(badRequest ? [ApiBadRequestResponse({ description: badRequest })] : []),
    ...(unauthorized ? [ApiUnauthorizedResponse({ description: unauthorized })] : []),
    ...(notFound ? [ApiNotFoundResponse({ description: notFound })] : []),
  );
}

/** Controlador que exige JWT (`bearerAuth`): agrupa en Swagger, documenta el esquema y aplica el guard. */
export function ApiProtected(tag: string) {
  return applyDecorators(ApiTags(tag), ApiBearerAuth(), UseGuards(JwtAuthGuard));
}

/** Controlador protegido con JWT montado en `path` (ver {@link ApiProtected}). */
export function ApiResource(tag: string, path: string) {
  return applyDecorators(ApiProtected(tag), Controller(path));
}

const ROUTE_METHODS = { get: Get, post: Post, put: Put, patch: Patch, delete: Delete };

export type HttpMethod = keyof typeof ROUTE_METHODS;

/**
 * Ruta HTTP (`method` + `path` de Nest) documentada con {@link ApiEndpoint}. `'hidden'` la
 * deja fuera de Swagger (alias que no figuran en openapi.yaml).
 */
export function ApiRoute(method: HttpMethod, path: string | undefined, options: ApiEndpointOptions | 'hidden') {
  const docs = options === 'hidden' ? ApiExcludeEndpoint() : ApiEndpoint(options);
  return applyDecorators(ROUTE_METHODS[method](path), docs);
}
