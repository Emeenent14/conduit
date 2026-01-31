import { Router, Request } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as dashboardService from '../services/dashboard.service';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        [key: string]: any;
    };
}

const router = Router();

router.use(authenticate);

// GET /dashboard/stats
router.get('/stats', async (req, res, next) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const stats = await dashboardService.getDashboardStats(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

// GET /dashboard/activity
router.get('/activity', async (req, res, next) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const activity = await dashboardService.getRecentActivity(userId);
        res.json({ success: true, data: activity });
    } catch (error) {
        next(error);
    }
});

export default router;
