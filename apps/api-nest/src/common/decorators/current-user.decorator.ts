import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Reads the user attached to the request by JwtAuthGuard/OptionalJwtAuthGuard
 * (mirrors AuthenticatedRequest.user from the Express auth.middleware.ts).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
