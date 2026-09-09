import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Extrae el usuario autenticado (`sub`/`email` del JWT) que {@link JwtAuthGuard}
 * deja en `request.user`. Solo debe usarse en rutas protegidas por ese guard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser;
  },
);
