import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET /templates
// ============================================

router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      apps,
      q,
      sort = 'popularity',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { tags: { has: q as string } },
      ];
    }

    // Build order clause
    let orderBy: any = { popularity: 'desc' };
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    // Execute query
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
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
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      }),
      prisma.template.count({ where }),
    ]);

    // Get app details for required apps
    const appIds = [...new Set(templates.flatMap(t => t.requiredAppIds))];
    const appsData = await prisma.app.findMany({
      where: { id: { in: appIds } },
      select: { id: true, slug: true, name: true, iconUrl: true },
    });

    const appsMap = new Map(appsData.map(a => [a.id, a]));

    // Format response
    const formattedTemplates = templates.map(t => ({
      ...t,
      requiredApps: t.requiredAppIds
        .map(id => appsMap.get(id))
        .filter(Boolean)
        .map(a => ({ slug: a!.slug, name: a!.name, icon: a!.iconUrl })),
      requiredAppIds: undefined, // Remove raw IDs
    }));

    res.json({
      success: true,
      data: formattedTemplates,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /templates/categories
// ============================================

router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { templates: { where: { isActive: true } } },
        },
      },
    });

    const formatted = categories.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      templateCount: c._count.templates,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /templates/:slug
// ============================================

router.get('/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!template || !template.isActive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      });
      return;
    }

    // Get required apps
    const apps = await prisma.app.findMany({
      where: { id: { in: template.requiredAppIds } },
    });

    const formattedApps = apps.map(app => ({
      slug: app.slug,
      name: app.name,
      icon: app.iconUrl,
      authType: app.authType,
      description: app.description,
      apiKeyInstructions: app.apiKeyInstructions,
    }));

    res.json({
      success: true,
      data: {
        ...template,
        requiredApps: formattedApps,
        requiredAppIds: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
