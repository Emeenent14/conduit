import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateProfileInput {
  name?: string;
  timezone?: string;
  notificationEmail?: boolean;
  notificationSlack?: boolean;
}

const PROFILE_SELECT = {
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
} as const;

/**
 * Port of routes/user.routes.ts.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { name, timezone, notificationEmail, notificationSlack } = input;

    return this.prisma.user.update({
      where: { id: userId },
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
  }
}
