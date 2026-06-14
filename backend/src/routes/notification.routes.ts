import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
