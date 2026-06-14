import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', authorize('COMPANY_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId! },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('COMPANY_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['COMPANY_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'REPORTING_MANAGER', 'EMPLOYEE']),
    });
    const data = schema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: { ...data, passwordHash, companyId: req.user!.companyId! },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
