import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Extrae el `id` del usuario autenticado (`sub` del JWT) que {@link JwtAuthGuard}
 * deja en `request.user`. Solo debe usarse en rutas protegidas por ese guard.
 */
export const UserId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<Request>();
  return (request.user as AuthenticatedUser).id;
});
