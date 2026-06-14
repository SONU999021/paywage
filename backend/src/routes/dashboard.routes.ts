import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.companyId) {
      res.status(403).json({ error: 'Company access required' });
      return;
    }
    const stats = await dashboardService.getDashboardStats(req.user.companyId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
