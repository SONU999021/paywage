import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('COMPANY_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { companyId: req.user!.companyId! },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where: { companyId: req.user!.companyId! } }),
    ]);

    res.json({ logs, total, page, limit });
  } catch (err) {
    next(err);
  }
});

export default router;
