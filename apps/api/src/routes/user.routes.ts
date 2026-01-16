import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /user/profile - Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        notificationEmail: true,
        notificationSlack: true,
        timezone: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

// PATCH /user/profile - Update user profile
router.patch('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, timezone, notificationEmail, notificationSlack } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(notificationEmail !== undefined && { notificationEmail }),
        ...(notificationSlack !== undefined && { notificationSlack }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        notificationEmail: true,
        notificationSlack: true,
        timezone: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

export default router;
