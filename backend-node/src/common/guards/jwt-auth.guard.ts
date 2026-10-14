import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
}

const UNAUTHORIZED_MESSAGE = 'Unauthorized';

/**
 * Protege rutas exigiendo `Authorization: Bearer <access_token>` (RF-03).
 * No usa Passport (no está instalado): verifica el JWT directamente con
 * {@link JwtService} y expone el usuario autenticado en `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      request.user = { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;

    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
  }
}
