import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { AppConfigService } from '../config/app-config.service';
import { ApiException } from '../common/exceptions/api.exception';
import { RegisterDto, LoginDto } from './dto/auth.schemas';

export interface JwtPayload {
  userId: string;
  email: string;
  type?: string;
  iat: number;
  exp: number;
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Port of routes/auth.routes.ts handlers plus the token helpers that lived
 * in middleware/auth.middleware.ts.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly encryption: EncryptionService,
    private readonly config: AppConfigService,
  ) {}

  generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { userId, email },
      {
        secret: this.config.jwt.secret,
        expiresIn: this.config.jwt.expiresIn as any,
      },
    );
  }

  generateRefreshToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { userId, email, type: 'refresh' },
      {
        secret: this.config.jwt.secret,
        expiresIn: this.config.jwt.refreshExpiresIn as any,
      },
    );
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.jwt.secret,
    });
  }

  getTokenExpirySeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  async register(input: RegisterDto, meta: RequestMeta) {
    const { email, password, name } = input;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw ApiException.conflict('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.encryption.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirySeconds(this.config.jwt.expiresIn),
    };
  }

  async login(input: LoginDto, meta: RequestMeta) {
    const { email, password } = input;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw ApiException.unauthorized('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw ApiException.unauthorized('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.encryption.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirySeconds(this.config.jwt.expiresIn),
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiException.unauthorized('Invalid refresh token');
    }

    const tokenHash = this.encryption.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw ApiException.unauthorized('Refresh token not found or expired');
    }

    const accessToken = this.generateAccessToken(payload.userId, payload.email);

    return {
      accessToken,
      expiresIn: this.getTokenExpirySeconds(this.config.jwt.expiresIn),
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { workflows: true, credentials: true } },
      },
    });

    if (!userData) {
      throw ApiException.notFound('User');
    }

    const workflowStats = await this.prisma.userWorkflow.aggregate({
      where: { userId, isActive: true },
      _count: true,
    });

    const executionStats = await this.prisma.execution.groupBy({
      by: ['status'],
      where: { userWorkflow: { userId } },
      _count: true,
    });

    const totalExecutions = executionStats.reduce(
      (sum, e) => sum + e._count,
      0,
    );
    const successfulExecutions =
      executionStats.find((e) => e.status === 'success')?._count || 0;
    const successRate =
      totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100 * 10) / 10
        : 100;

    return {
      ...userData,
      stats: {
        activeWorkflows: workflowStats._count,
        totalWorkflows: userData._count.workflows,
        totalCredentials: userData._count.credentials,
        totalExecutions,
        successRate,
      },
    };
  }
}
