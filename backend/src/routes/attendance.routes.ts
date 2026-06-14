import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as attendanceService from '../services/attendance.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await attendanceService.listAttendance(req.user!.companyId!, {
      date: req.query.date as string,
      employeeId: req.query.employeeId as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = attendanceService.attendanceSchema.parse(req.body);
    const record = await attendanceService.upsertAttendance(req.user!.companyId!, data);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

router.post('/bulk', async (req: AuthRequest, res, next) => {
  try {
    const records = req.body.records.map((r: unknown) => attendanceService.attendanceSchema.parse(r));
    const result = await attendanceService.bulkImportAttendance(req.user!.companyId!, records);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
