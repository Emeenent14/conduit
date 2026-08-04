import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiException } from '../../common/exceptions/api.exception';

describe(OptionalJwtAuthGuard, () => {
  let guard: OptionalJwtAuthGuard;
  let jwtAuthGuard: { canActivate: jest.Mock };

  const buildContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    jwtAuthGuard = { canActivate: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OptionalJwtAuthGuard,
        { provide: JwtAuthGuard, useValue: jwtAuthGuard },
      ],
    }).compile();

    guard = moduleRef.get(OptionalJwtAuthGuard);
  });

  describe('canActivate', () => {
    it('returns true without delegating when the Authorization header is missing', async () => {
      const context = buildContext({ headers: {} });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    });

    it('returns true without delegating when the header does not start with "Bearer "', async () => {
      const context = buildContext({
        headers: { authorization: 'Token abc123' },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    });

    it('delegates to JwtAuthGuard and returns its resolved value when a Bearer header is present', async () => {
      const context = buildContext({
        headers: { authorization: 'Bearer good' },
      });
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it('propagates an error thrown by JwtAuthGuard when a Bearer header is present but invalid', async () => {
      const context = buildContext({
        headers: { authorization: 'Bearer bad' },
      });
      const error = ApiException.unauthorized('Invalid token');
      jwtAuthGuard.canActivate.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toBe(error);
    });
  });
});
