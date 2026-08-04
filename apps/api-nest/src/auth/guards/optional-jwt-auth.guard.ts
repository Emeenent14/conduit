import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Port of middleware/auth.middleware.ts's `optionalAuth`: if no Bearer
 * header is present the request proceeds unauthenticated, but a present-and-
 * invalid token still fails the same way full authentication would.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    return this.jwtAuthGuard.canActivate(context);
  }
}
