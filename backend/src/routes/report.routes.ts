import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/attendance', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user!.companyId!;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(1));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const records = await prisma.attendance.findMany({
      where: { employee: { companyId }, date: { gte: startDate, lte: endDate } },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true, department: true } } },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/payroll-register', async (req: AuthRequest, res, next) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const slips = await prisma.salarySlip.findMany({
      where: { payrollRun: { companyId: req.user!.companyId!, month, year } },
      include: { employee: true },
    });
    res.json(slips);
  } catch (err) {
    next(err);
  }
});

router.get('/pf-register', async (req: AuthRequest, res, next) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const records = await prisma.pfRecord.findMany({
      where: { employee: { companyId: req.user!.companyId! }, month, year },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/esi-register', async (req: AuthRequest, res, next) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const records = await prisma.esiRecord.findMany({
      where: { employee: { companyId: req.user!.companyId! }, month, year },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/department-cost', async (req: AuthRequest, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { companyId: req.user!.companyId!, status: 'ACTIVE' },
      include: { department: true },
    });

    const costs: Record<string, number> = {};
    employees.forEach((e: { department: { name: string } | null; grossSalary: unknown }) => {
      const dept = e.department?.name || 'Unassigned';
      costs[dept] = (costs[dept] || 0) + Number(e.grossSalary);
    });

    res.json(Object.entries(costs).map(([department, totalCost]) => ({ department, totalCost })));
  } catch (err) {
    next(err);
  }
});

export default router;
