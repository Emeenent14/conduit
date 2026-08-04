import { TemplatesService } from './templates.service';
import { ApiException } from '../common/exceptions/api.exception';

describe(TemplatesService, () => {
  let service: TemplatesService;
  let mockPrisma: {
    template: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
    app: {
      findMany: jest.Mock;
    };
    category: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      template: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      app: {
        findMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
    };
    service = new TemplatesService(mockPrisma as any);
  });

  describe('list', () => {
    beforeEach(() => {
      mockPrisma.template.findMany.mockResolvedValue([]);
      mockPrisma.template.count.mockResolvedValue(0);
      mockPrisma.app.findMany.mockResolvedValue([]);
    });

    describe('pagination math', () => {
      it('defaults to page 1, limit 20, skip 0 when query is empty', async () => {
        await service.list({});

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.skip).toBe(0);
        expect(call.take).toBe(20);
      });

      it('computes skip from page and limit', async () => {
        const result = await service.list({ page: '3', limit: '10' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.skip).toBe(20);
        expect(call.take).toBe(10);
        expect(result.meta).toEqual({
          page: 3,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      });

      it('clamps limit above 100 down to 100', async () => {
        await service.list({ limit: '500' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.take).toBe(100);
      });

      it('falls back to the default of 20 when limit is 0 (falsy parseInt result)', async () => {
        await service.list({ limit: '0' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.take).toBe(20);
      });

      it('clamps a negative limit up to 1', async () => {
        await service.list({ limit: '-5' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.take).toBe(1);
      });

      it('clamps page below 1 up to 1', async () => {
        const result = await service.list({ page: '0' });

        expect(result.meta.page).toBe(1);
        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.skip).toBe(0);
      });

      it('clamps a negative page up to 1', async () => {
        const result = await service.list({ page: '-3' });

        expect(result.meta.page).toBe(1);
        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.skip).toBe(0);
      });

      it('falls back to defaults for non-numeric page/limit', async () => {
        const result = await service.list({ page: 'abc', limit: 'xyz' });

        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(20);
      });
    });

    describe('category filter', () => {
      it('adds a category.slug filter when category is provided', async () => {
        await service.list({ category: 'productivity' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.where.category).toEqual({ slug: 'productivity' });
      });

      it('omits the category filter when not provided', async () => {
        await service.list({});

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.where.category).toBeUndefined();
        expect(call.where).toEqual({ isActive: true });
      });
    });

    describe('q search', () => {
      it('builds an OR clause across name, description, and tags', async () => {
        await service.list({ q: 'slack' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.where.OR).toEqual([
          { name: { contains: 'slack', mode: 'insensitive' } },
          { description: { contains: 'slack', mode: 'insensitive' } },
          { tags: { has: 'slack' } },
        ]);
      });

      it('omits the OR clause when q is not provided', async () => {
        await service.list({});

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.where.OR).toBeUndefined();
      });
    });

    describe('sort', () => {
      it('defaults to popularity desc', async () => {
        await service.list({});

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.orderBy).toEqual({ popularity: 'desc' });
      });

      it('sorts by newest (createdAt desc)', async () => {
        await service.list({ sort: 'newest' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.orderBy).toEqual({ createdAt: 'desc' });
      });

      it('sorts by name asc', async () => {
        await service.list({ sort: 'name' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.orderBy).toEqual({ name: 'asc' });
      });

      it('falls back to popularity desc for an unrecognized sort value', async () => {
        await service.list({ sort: 'bogus' });

        const call = mockPrisma.template.findMany.mock.calls[0][0];
        expect(call.orderBy).toEqual({ popularity: 'desc' });
      });
    });

    describe('app enrichment', () => {
      it('dedupes requiredAppIds across templates, maps them via appsMap, and strips requiredAppIds from the output', async () => {
        mockPrisma.template.findMany.mockResolvedValue([
          {
            id: 't1',
            slug: 'template-1',
            name: 'Template 1',
            requiredAppIds: ['app-1', 'app-2'],
          },
          {
            id: 't2',
            slug: 'template-2',
            name: 'Template 2',
            requiredAppIds: ['app-2', 'app-3'],
          },
        ]);
        mockPrisma.template.count.mockResolvedValue(2);
        mockPrisma.app.findMany.mockResolvedValue([
          { id: 'app-1', slug: 'slack', name: 'Slack', iconUrl: 'slack.png' },
          { id: 'app-2', slug: 'gmail', name: 'Gmail', iconUrl: 'gmail.png' },
          { id: 'app-3', slug: 'github', name: 'GitHub', iconUrl: 'gh.png' },
        ]);

        const result = await service.list({});

        expect(mockPrisma.app.findMany).toHaveBeenCalledWith({
          where: { id: { in: ['app-1', 'app-2', 'app-3'] } },
          select: { id: true, slug: true, name: true, iconUrl: true },
        });

        expect(result.templates[0].requiredApps).toEqual([
          { slug: 'slack', name: 'Slack', icon: 'slack.png' },
          { slug: 'gmail', name: 'Gmail', icon: 'gmail.png' },
        ]);
        expect(result.templates[1].requiredApps).toEqual([
          { slug: 'gmail', name: 'Gmail', icon: 'gmail.png' },
          { slug: 'github', name: 'GitHub', icon: 'gh.png' },
        ]);

        for (const t of result.templates) {
          expect(t.requiredAppIds).toBeUndefined();
          expect(
            Object.prototype.hasOwnProperty.call(t, 'requiredAppIds'),
          ).toBe(true);
        }
      });

      it('filters out unresolved app ids that are missing from appsMap', async () => {
        mockPrisma.template.findMany.mockResolvedValue([
          {
            id: 't1',
            slug: 'template-1',
            name: 'Template 1',
            requiredAppIds: ['app-1', 'app-missing'],
          },
        ]);
        mockPrisma.template.count.mockResolvedValue(1);
        mockPrisma.app.findMany.mockResolvedValue([
          { id: 'app-1', slug: 'slack', name: 'Slack', iconUrl: 'slack.png' },
        ]);

        const result = await service.list({});

        expect(result.templates[0].requiredApps).toEqual([
          { slug: 'slack', name: 'Slack', icon: 'slack.png' },
        ]);
      });

      it('computes totalPages from total and limit', async () => {
        mockPrisma.template.count.mockResolvedValue(45);

        const result = await service.list({ limit: '20' });

        expect(result.meta.total).toBe(45);
        expect(result.meta.totalPages).toBe(3);
      });
    });
  });

  describe('listCategories', () => {
    it('maps _count.templates to templateCount', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          slug: 'productivity',
          name: 'Productivity',
          description: 'Productivity templates',
          icon: 'icon.png',
          _count: { templates: 7 },
        },
        {
          id: 'cat-2',
          slug: 'sales',
          name: 'Sales',
          description: null,
          icon: null,
          _count: { templates: 0 },
        },
      ]);

      const result = await service.listCategories();

      expect(result).toEqual([
        {
          id: 'cat-1',
          slug: 'productivity',
          name: 'Productivity',
          description: 'Productivity templates',
          icon: 'icon.png',
          templateCount: 7,
        },
        {
          id: 'cat-2',
          slug: 'sales',
          name: 'Sales',
          description: null,
          icon: null,
          templateCount: 0,
        },
      ]);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { templates: { where: { isActive: true } } } },
        },
      });
    });
  });

  describe('findBySlug', () => {
    it('enriches the found, active template with requiredApps and strips requiredAppIds', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't1',
        slug: 'my-template',
        isActive: true,
        requiredAppIds: ['app-1'],
      });
      mockPrisma.app.findMany.mockResolvedValue([
        {
          id: 'app-1',
          slug: 'slack',
          name: 'Slack',
          iconUrl: 'slack.png',
          authType: 'oauth2',
          description: 'Slack app',
          apiKeyInstructions: null,
        },
      ]);

      const result = await service.findBySlug('my-template');

      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { slug: 'my-template' },
        include: { category: true },
      });
      expect(result.requiredApps).toEqual([
        {
          slug: 'slack',
          name: 'Slack',
          icon: 'slack.png',
          authType: 'oauth2',
          description: 'Slack app',
          apiKeyInstructions: null,
        },
      ]);
      expect(result.requiredAppIds).toBeUndefined();
    });

    it('throws ApiException.notFound when the template does not exist', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('missing')).rejects.toMatchObject({
        message: 'Template not found',
        code: 'NOT_FOUND',
        status: 404,
      });
      expect(mockPrisma.app.findMany).not.toHaveBeenCalled();
    });

    it('throws ApiException.notFound when the template is found but inactive', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't1',
        slug: 'inactive-template',
        isActive: false,
        requiredAppIds: [],
      });

      await expect(
        service.findBySlug('inactive-template'),
      ).rejects.toBeInstanceOf(ApiException);
      expect(mockPrisma.app.findMany).not.toHaveBeenCalled();
    });
  });
});
