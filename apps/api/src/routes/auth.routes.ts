import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirySeconds,
  AuthenticatedRequest,
} from '../middleware/auth.middleware';
import { hashToken, generateToken } from '../services/encryption.service';
import { config } from '../config';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// POST /auth/register
// ============================================

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: getTokenExpirySeconds(config.jwt.expiresIn),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /auth/login
// ============================================

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
        expiresIn: getTokenExpirySeconds(config.jwt.expiresIn),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /auth/refresh
// ============================================

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    // Verify token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Check token in database
    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new ApiError(401, 'Refresh token not found or expired');
    }

    // Generate new access token
    const accessToken = generateAccessToken(payload.userId, payload.email);

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: getTokenExpirySeconds(config.jwt.expiresIn),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /auth/logout
// ============================================

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthenticatedRequest;

    // Revoke all refresh tokens for user
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /auth/me
// ============================================

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthenticatedRequest;

    // Get full user data with stats
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            workflows: true,
            credentials: true,
          },
        },
      },
    });

    if (!userData) {
      throw ApiError.notFound('User');
    }

    // Get workflow stats
    const workflowStats = await prisma.userWorkflow.aggregate({
      where: { userId: user.id, isActive: true },
      _count: true,
    });

    const executionStats = await prisma.execution.groupBy({
      by: ['status'],
      where: {
        userWorkflow: { userId: user.id },
      },
      _count: true,
    });

    const totalExecutions = executionStats.reduce((sum, e) => sum + e._count, 0);
    const successfulExecutions = executionStats.find(e => e.status === 'success')?._count || 0;
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100 * 10) / 10 
      : 100;

    res.json({
      success: true,
      data: {
        ...userData,
        stats: {
          activeWorkflows: workflowStats._count,
          totalWorkflows: userData._count.workflows,
          totalCredentials: userData._count.credentials,
          totalExecutions,
          successRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
