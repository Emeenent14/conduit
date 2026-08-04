import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { ApiException } from '../../common/exceptions/api.exception';

describe(JwtAuthGuard, () => {
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };
  let config: { jwt: { secret: string } };

  const buildContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };
    prisma = { user: { findUnique: jest.fn() } };
    config = { jwt: { secret: 'x' } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: AppConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = moduleRef.get(JwtAuthGuard);
  });

  describe('canActivate', () => {
    it('throws ApiException 401 UNAUTHORIZED when the Authorization header is missing', async () => {
      const request: any = { headers: {} };
      const context = buildContext(request);

      let caught: unknown;
      try {
        await guard.canActivate(context);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(ApiException);
      expect(caught).toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('throws ApiException 401 when the header does not start with "Bearer "', async () => {
      const request: any = { headers: { authorization: 'Token abc123' } };
      const context = buildContext(request);

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('throws "Token expired" when verify throws a TokenExpiredError', async () => {
      const request: any = { headers: { authorization: 'Bearer expired' } };
      const context = buildContext(request);
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw err;
      });

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Token expired',
      });
    });

    it('throws "Invalid token" for other verify failures', async () => {
      const request: any = { headers: { authorization: 'Bearer bad' } };
      const context = buildContext(request);
      jwtService.verify.mockImplementation(() => {
        throw new Error('malformed');
      });

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    });

    it('throws "User not found" when verify succeeds but no user exists', async () => {
      const request: any = { headers: { authorization: 'Bearer good' } };
      const context = buildContext(request);
      jwtService.verify.mockReturnValue({
        userId: 'user-1',
        email: 'a@b.com',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, name: true },
      });
    });

    it('returns true and attaches the user to the request on success', async () => {
      const request: any = { headers: { authorization: 'Bearer good' } };
      const context = buildContext(request);
      jwtService.verify.mockReturnValue({
        userId: 'user-1',
        email: 'a@b.com',
      });
      const foundUser = { id: 'user-1', email: 'a@b.com', name: 'Alice' };
      prisma.user.findUnique.mockResolvedValue(foundUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBe(foundUser);
      expect(jwtService.verify).toHaveBeenCalledWith('good', {
        secret: 'x',
      });
    });
  });
});
