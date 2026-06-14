import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import * as payrollService from '../services/payroll.service.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/runs', async (req: AuthRequest, res, next) => {
  try {
    const runs = await prisma.payrollRun.findMany({
      where: { companyId: req.user!.companyId! },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

router.post('/process', authorize('COMPANY_ADMIN', 'PAYROLL_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const { month, year } = z.object({ month: z.number(), year: z.number() }).parse(req.body);
    const result = await payrollService.processPayroll(req.user!.companyId!, month, year);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/lock', authorize('COMPANY_ADMIN', 'PAYROLL_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const result = await payrollService.lockPayroll(req.user!.companyId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/rules', async (req: AuthRequest, res, next) => {
  try {
    const rules = await prisma.payrollRule.findMany({
      where: { companyId: req.user!.companyId! },
      orderBy: { priority: 'asc' },
    });
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

router.post('/rules', authorize('COMPANY_ADMIN', 'PAYROLL_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string(),
      description: z.string().optional(),
      condition: z.object({ field: z.string(), operator: z.string(), value: z.union([z.string(), z.number()]) }),
      action: z.object({ type: z.string(), value: z.union([z.string(), z.number()]).optional() }),
      priority: z.number().default(0),
    });
    const data = schema.parse(req.body);
    const rule = await prisma.payrollRule.create({
      data: { companyId: req.user!.companyId!, ...data },
    });
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

export default router;
