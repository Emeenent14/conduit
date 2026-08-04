import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { JwtPayload } from '../auth.service';

/**
 * Port of middleware/auth.middleware.ts's `authenticate`. Verifies the
 * Bearer token, loads the user, and attaches it to the request the same
 * way AuthenticatedRequest.user did in Express.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiException.unauthorized('No authentication token provided');
    }

    const token = authHeader.substring(7);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.jwt.secret,
      });
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        throw ApiException.unauthorized('Token expired');
      }
      throw ApiException.unauthorized('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw ApiException.unauthorized('User not found');
    }

    request.user = user;
    return true;
  }
}
