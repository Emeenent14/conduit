import { UsersService } from './users.service';

describe(UsersService, () => {
  let service: UsersService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new UsersService(mockPrisma as any);
  });

  describe('getProfile', () => {
    it('calls findUnique with the correct where and select, returning the result', async () => {
      const user = { id: 'user-1', email: 'a@b.com', name: 'Alice' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
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
      expect(result).toBe(user);
    });

    it('returns null when prisma finds no user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('missing-user');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('includes only the fields that were provided', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateProfile('user-1', { name: 'New Name' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
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
    });

    it('omits fields that are undefined/absent from the input', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateProfile('user-1', { timezone: 'UTC' });

      const call = mockPrisma.user.update.mock.calls[0][0];
      expect(call.data).toEqual({ timezone: 'UTC' });
      expect(call.data).not.toHaveProperty('name');
      expect(call.data).not.toHaveProperty('notificationEmail');
      expect(call.data).not.toHaveProperty('notificationSlack');
    });

    it('includes falsy-but-defined boolean fields like notificationEmail: false', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateProfile('user-1', {
        notificationEmail: false,
        notificationSlack: false,
      });

      const call = mockPrisma.user.update.mock.calls[0][0];
      expect(call.data).toEqual({
        notificationEmail: false,
        notificationSlack: false,
      });
    });

    it('builds an empty data object when no fields are provided', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateProfile('user-1', {});

      const call = mockPrisma.user.update.mock.calls[0][0];
      expect(call.data).toEqual({});
      expect(call.where).toEqual({ id: 'user-1' });
    });

    it('returns whatever prisma.update resolves with', async () => {
      const updated = { id: 'user-1', name: 'Updated' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', {
        name: 'Updated',
      });

      expect(result).toBe(updated);
    });
  });
});
