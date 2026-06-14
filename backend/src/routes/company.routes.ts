import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      include: { departments: true, branches: true },
    });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

router.put('/', authorize('COMPANY_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.user!.companyId! },
      data: req.body,
    });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

router.post('/departments', authorize('COMPANY_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const dept = await prisma.department.create({
      data: { companyId: req.user!.companyId!, name: req.body.name },
    });
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
});

router.post('/branches', authorize('COMPANY_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const branch = await prisma.branch.create({
      data: { companyId: req.user!.companyId!, name: req.body.name, address: req.body.address },
    });
    res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
});

export default router;
