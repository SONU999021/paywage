import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as salarySlipService from '../services/salarySlip.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const slips = await salarySlipService.listSalarySlips(req.user!.companyId!, {
      employeeId: req.query.employeeId as string,
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    res.json(slips);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const slip = await salarySlipService.getSalarySlip(req.user!.companyId!, req.params.id);
    res.json(slip);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/pdf', async (req: AuthRequest, res, next) => {
  try {
    const pdf = await salarySlipService.generateSalarySlipPdf(req.user!.companyId!, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
