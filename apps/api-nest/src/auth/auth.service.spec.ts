import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { ApiException } from '../common/exceptions/api.exception';
import type { RegisterDto, LoginDto } from './dto/auth.schemas';

describe(AuthService, () => {
  let mockPrisma: any;
  let mockJwt: any;
  let mockEncryption: any;
  let mockConfig: any;
  let service: AuthService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      userWorkflow: {
        aggregate: jest.fn(),
      },
      execution: {
        groupBy: jest.fn(),
      },
    };

    mockJwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockEncryption = {
      hashToken: jest.fn((t: string) => `hash:${t}`),
    };

    mockConfig = {
      jwt: {
        secret: 'test-secret',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
      },
    };

    service = new AuthService(mockPrisma, mockJwt, mockEncryption, mockConfig);
  });

  describe('generateAccessToken', () => {
    it('signs a payload with userId/email and the configured expiresIn', () => {
      mockJwt.sign.mockReturnValue('signed-access-token');

      const result = service.generateAccessToken('user-1', 'user@example.com');

      expect(result).toBe('signed-access-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1', email: 'user@example.com' },
        { secret: 'test-secret', expiresIn: '15m' },
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('signs a payload with type refresh and the configured refreshExpiresIn', () => {
      mockJwt.sign.mockReturnValue('signed-refresh-token');

      const result = service.generateRefreshToken('user-1', 'user@example.com');

      expect(result).toBe('signed-refresh-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1', email: 'user@example.com', type: 'refresh' },
        { secret: 'test-secret', expiresIn: '7d' },
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('delegates to jwtService.verify with the configured secret', () => {
      const payload = { userId: 'user-1', email: 'user@example.com' };
      mockJwt.verify.mockReturnValue(payload);

      const result = service.verifyRefreshToken('some-token');

      expect(result).toBe(payload);
      expect(mockJwt.verify).toHaveBeenCalledWith('some-token', {
        secret: 'test-secret',
      });
    });
  });

  describe('getTokenExpirySeconds', () => {
    it.each([
      ['15m', 900],
      ['1h', 3600],
      ['7d', 604800],
      ['30s', 30],
      ['bogus', 900],
    ])('parses %s as %d seconds', (input, expected) => {
      expect(service.getTokenExpirySeconds(input)).toBe(expected);
    });
  });

  describe('register', () => {
    const registerInput: RegisterDto = {
      email: 'new@example.com',
      password: 'Password123',
      name: 'New User',
    };
    const meta = { userAgent: 'jest-agent', ipAddress: '127.0.0.1' };

    it('creates a user and refresh token row, returning tokens on the happy path', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'user-1',
        email: registerInput.email,
        name: registerInput.name,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(registerInput, meta);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email },
      });

      const createArgs = mockPrisma.user.create.mock.calls[0][0];
      expect(createArgs.data.email).toBe(registerInput.email);
      expect(createArgs.data.name).toBe(registerInput.name);
      expect(createArgs.data.passwordHash).not.toBe(registerInput.password);
      const isValidHash = await bcrypt.compare(
        registerInput.password,
        createArgs.data.passwordHash,
      );
      expect(isValidHash).toBe(true);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: createdUser.id,
          tokenHash: 'hash:refresh-token',
          expiresAt: expect.any(Date),
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
        },
      });

      expect(result).toEqual({
        user: createdUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      });
    });

    it('throws a 409 ApiException with code CONFLICT when the email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerInput, meta)).rejects.toThrow(
        ApiException,
      );

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });
      try {
        await service.register(registerInput, meta);
        fail('expected register to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(409);
        expect(apiErr.code).toBe('CONFLICT');
      }

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginInput: LoginDto = {
      email: 'user@example.com',
      password: 'correct-password',
    };
    const meta = { userAgent: 'jest-agent', ipAddress: '127.0.0.1' };
    const correctHash = bcrypt.hashSync('correct-password', 12);

    it('returns tokens and updates lastLoginAt on the happy path', async () => {
      const storedUser = {
        id: 'user-1',
        email: loginInput.email,
        name: 'Some User',
        passwordHash: correctHash,
      };
      mockPrisma.user.findUnique.mockResolvedValue(storedUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(loginInput, meta);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: storedUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });

      expect(result).toEqual({
        user: {
          id: storedUser.id,
          email: storedUser.email,
          name: storedUser.name,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      });
    });

    it('throws a 401 ApiException UNAUTHORIZED when the user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        await service.login(loginInput, meta);
        fail('expected login to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(401);
        expect(apiErr.code).toBe('UNAUTHORIZED');
      }
    });

    it('throws a 401 ApiException UNAUTHORIZED when the user has no passwordHash (OAuth-only)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginInput.email,
        name: 'OAuth User',
        passwordHash: null,
      });

      try {
        await service.login(loginInput, meta);
        fail('expected login to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(401);
        expect(apiErr.code).toBe('UNAUTHORIZED');
      }
    });

    it('throws a 401 ApiException UNAUTHORIZED when the password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginInput.email,
        name: 'Some User',
        passwordHash: correctHash,
      });

      try {
        await service.login(
          { email: loginInput.email, password: 'wrong-password' },
          meta,
        );
        fail('expected login to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(401);
        expect(apiErr.code).toBe('UNAUTHORIZED');
      }

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('returns a new access token on the happy path', async () => {
      const payload = { userId: 'user-1', email: 'user@example.com' };
      mockJwt.verify.mockReturnValue(payload);
      mockPrisma.refreshToken.findFirst.mockResolvedValue({ id: 'stored-1' });
      mockJwt.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('a-valid-refresh-token');

      expect(mockEncryption.hashToken).toHaveBeenCalledWith(
        'a-valid-refresh-token',
      );
      expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          userId: payload.userId,
          tokenHash: 'hash:a-valid-refresh-token',
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 900,
      });
    });

    it('throws "Invalid refresh token" (401) when verification fails', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('bad signature');
      });

      try {
        await service.refresh('bad-token');
        fail('expected refresh to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(401);
        expect(apiErr.message).toBe('Invalid refresh token');
      }

      expect(mockPrisma.refreshToken.findFirst).not.toHaveBeenCalled();
    });

    it('throws "Refresh token not found or expired" (401) when no stored token matches', async () => {
      mockJwt.verify.mockReturnValue({
        userId: 'user-1',
        email: 'user@example.com',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      try {
        await service.refresh('a-valid-refresh-token');
        fail('expected refresh to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(401);
        expect(apiErr.message).toBe('Refresh token not found or expired');
      }
    });
  });

  describe('logout', () => {
    it('revokes all active refresh tokens for the user and returns a success message', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-1');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revoked: false },
        data: { revoked: true, revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('me', () => {
    const userData = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Some User',
      avatarUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { workflows: 5, credentials: 2 },
    };

    it('aggregates workflow/execution stats with a whole-number success rate (3 success + 1 error)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockPrisma.userWorkflow.aggregate.mockResolvedValue({ _count: 3 });
      mockPrisma.execution.groupBy.mockResolvedValue([
        { status: 'success', _count: 3 },
        { status: 'error', _count: 1 },
      ]);

      const result = await service.me('user-1');

      expect(mockPrisma.userWorkflow.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        _count: true,
      });
      expect(mockPrisma.execution.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userWorkflow: { userId: 'user-1' } },
        _count: true,
      });

      expect(result.stats).toEqual({
        activeWorkflows: 3,
        totalWorkflows: 5,
        totalCredentials: 2,
        totalExecutions: 4,
        successRate: 75,
      });
    });

    it('computes a fractional success rate rounded to one decimal (2 success out of 3)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockPrisma.userWorkflow.aggregate.mockResolvedValue({ _count: 1 });
      mockPrisma.execution.groupBy.mockResolvedValue([
        { status: 'success', _count: 2 },
        { status: 'error', _count: 1 },
      ]);

      const result = await service.me('user-1');

      expect(result.stats.totalExecutions).toBe(3);
      expect(result.stats.successRate).toBeCloseTo(66.7, 5);
    });

    it('defaults successRate to 100 when there are no executions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockPrisma.userWorkflow.aggregate.mockResolvedValue({ _count: 0 });
      mockPrisma.execution.groupBy.mockResolvedValue([]);

      const result = await service.me('user-1');

      expect(result.stats.totalExecutions).toBe(0);
      expect(result.stats.successRate).toBe(100);
    });

    it('throws a 404 ApiException when the user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        await service.me('missing-user');
        fail('expected me to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiErr = err as ApiException;
        expect(apiErr.getStatus()).toBe(404);
        expect(apiErr.code).toBe('NOT_FOUND');
      }

      expect(mockPrisma.userWorkflow.aggregate).not.toHaveBeenCalled();
      expect(mockPrisma.execution.groupBy).not.toHaveBeenCalled();
    });
  });
});
