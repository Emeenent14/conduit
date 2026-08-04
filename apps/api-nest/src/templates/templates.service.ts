import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';

export interface ListTemplatesQuery {
  page?: string;
  limit?: string;
  category?: string;
  apps?: string;
  q?: string;
  sort?: string;
}

/**
 * Port of routes/template.routes.ts.
 */
@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTemplatesQuery) {
    const {
      page = '1',
      limit = '20',
      category,
      q,
      sort = 'popularity',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    let orderBy: any = { popularity: 'desc' };
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          tags: true,
          popularity: true,
          estimatedSetupMinutes: true,
          requiredAppIds: true,
          category: { select: { id: true, slug: true, name: true } },
        },
      }),
      this.prisma.template.count({ where }),
    ]);

    const appIds = [...new Set(templates.flatMap((t) => t.requiredAppIds))];
    const appsData = await this.prisma.app.findMany({
      where: { id: { in: appIds } },
      select: { id: true, slug: true, name: true, iconUrl: true },
    });

    const appsMap = new Map(appsData.map((a) => [a.id, a]));

    const formattedTemplates = templates.map((t) => ({
      ...t,
      requiredApps: t.requiredAppIds
        .map((id) => appsMap.get(id))
        .filter(Boolean)
        .map((a) => ({ slug: a!.slug, name: a!.name, icon: a!.iconUrl })),
      requiredAppIds: undefined,
    }));

    return {
      templates: formattedTemplates,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { templates: { where: { isActive: true } } } },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      templateCount: c._count.templates,
    }));
  }

  async findBySlug(slug: string) {
    const template = await this.prisma.template.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!template || !template.isActive) {
      throw ApiException.notFound('Template');
    }

    const apps = await this.prisma.app.findMany({
      where: { id: { in: template.requiredAppIds } },
    });

    const requiredApps = apps.map((app) => ({
      slug: app.slug,
      name: app.name,
      icon: app.iconUrl,
      authType: app.authType,
      description: app.description,
      apiKeyInstructions: app.apiKeyInstructions,
    }));

    return {
      ...template,
      requiredApps,
      requiredAppIds: undefined,
    };
  }
}
